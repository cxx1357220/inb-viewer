

const { releaseSessions } = require("./ort");
const { chunkArray, clamp, resolveRuntimeBatchSize } = require("./utils");
const { runInference } = require("./infer");
const {
  getTransformOp,
  parseInferenceConfigText,
  toBgrFloatCHWFromBgr,
} = require("./common");


const DEFAULT_REC_ALPHANUMERIC_DICT = "0123456789abcdefghijklmnopqrstuvwxyz".split("");

const REC_NORMALIZE = Object.freeze({
  mean: [0.5, 0.5, 0.5],
  std: [0.5, 0.5, 0.5],
  scale: 1 / 255
});

const DEFAULT_REC_MODEL_PARSE_FALLBACKS = Object.freeze({
  imageShape: [3, 48, 320],
  charDict: []
});

const DEFAULT_REC_RUNTIME_LIMITS = Object.freeze({});

const MAX_REC_WIDTH = 3200;

const DEFAULT_REC_MODEL_CONFIG = Object.freeze({
  ...DEFAULT_REC_MODEL_PARSE_FALLBACKS
});

function parseRecModelConfigText(ocrRecModelYmlPath) {
  const parsed = parseInferenceConfigText(ocrRecModelYmlPath);
  const preProcess = parsed.PreProcess
  const transformOps = preProcess.transform_ops
  const resize = getTransformOp(transformOps, "RecResizeImg");
  const postprocess = (parsed.PostProcess || {});
  const baseCharDict = postprocess.character_dict;

  const imageShape = resize.image_shape;
  if (!imageShape || !Array.isArray(imageShape) || imageShape.length < 3) {
    throw new Error("RecResizeImg.image_shape is required in rec inference.yml");
  }

  const charDict =
    Array.isArray(baseCharDict) && baseCharDict.length > 0
      ? [...(baseCharDict), " "]
      : [...DEFAULT_REC_ALPHANUMERIC_DICT, " "];

  return {
    imageShape,
    charDict
  };
}



async function createRecModel({
  ort,
  ocrRecModelPath,
  ocrRecModelYmlPath,
  batchSize: batchSizeArg
}) {
  const config = parseRecModelConfigText(ocrRecModelYmlPath);
  const defaultBatchSize = Math.max(1, batchSizeArg || 1);
  let session = await ort.InferenceSession.create(ocrRecModelPath);


  return {
    kind: "rec",
    config,
    async predict(cv, mats, overrides={}) {
      const batchSize = resolveRuntimeBatchSize(overrides.batchSize, defaultBatchSize);
      const ctx = { cv, config };
      const samples = preprocess(ctx, mats);
      const charDict = config.charDict;
      const ordered = samples.slice().sort((a, b) => a.width - b.width);
      const decoded = [];
      const targetH = config.imageShape[1];

      for (const batch of chunkArray(ordered, batchSize)) {
        const inputTensor = packRecBatchTensor(ort, batch, targetH);
        const output = await runInference(session, inputTensor);
        const batchResults = postprocess(output, charDict);
        for (let index = 0; index < batchResults.length; index += 1) {
          decoded.push({
            inputIndex: batch[index].inputIndex,
            ...batchResults[index]
          });
        }
      }

      decoded.sort((a, b) => a.inputIndex - b.inputIndex);
      return decoded.map(({ text, score }) => ({ text, score }));
    },
    async dispose() {
      await releaseSessions(session);
      sessionState = null;
    }
  };
}



function preprocess(context, mats) {
  const samples = [];
  for (let i = 0; i < mats.length; i += 1) {
    samples.push(preprocessSample(context, mats[i], i));
  }
  return samples;
}

function preprocessSample(
  context,
  cropMat,
  inputIndex
) {
  const { cv, config } = context;
  const [channels, targetH, baseW] = config.imageShape;
  const srcW = cropMat.cols;
  const srcH = cropMat.rows;
  if (channels !== 3) {
    throw new Error(`Unexpected recognition channels: ${String(channels)}`);
  }
  const ratio = srcW / Math.max(1, srcH);
  const maxWhRatio = Math.max(baseW / Math.max(1, targetH), ratio);
  const recW = clamp(Math.trunc(targetH * maxWhRatio), 1, MAX_REC_WIDTH);
  const resizedW = Math.min(recW, Math.ceil(targetH * ratio));
  const resized = new cv.Mat();
  const bgr = new cv.Mat();
  cv.resize(cropMat, resized, new cv.Size(resizedW, targetH), 0, 0, cv.INTER_LINEAR);
  if (resized.channels() === 4) {
    cv.cvtColor(resized, bgr, cv.COLOR_RGBA2BGR);
  } else if (resized.channels() === 1) {
    cv.cvtColor(resized, bgr, cv.COLOR_GRAY2BGR);
  } else {
    resized.copyTo(bgr);
  }
  const resizedChw = toBgrFloatCHWFromBgr(bgr.data, resizedW, targetH, REC_NORMALIZE);
  const chw = new Float32Array(3 * targetH * recW);
  const dstPerChannel = targetH * recW;
  const srcPerChannel = targetH * resizedW;
  for (let channel = 0; channel < 3; channel += 1) {
    for (let row = 0; row < targetH; row += 1) {
      const srcStart = channel * srcPerChannel + row * resizedW;
      const dstStart = channel * dstPerChannel + row * recW;
      chw.set(resizedChw.subarray(srcStart, srcStart + resizedW), dstStart);
    }
  }
  bgr.delete();
  resized.delete();
  return { inputIndex, width: recW, chw };
}

function createBatchTensor(
  ort,
  samples,
  maxW,
  targetH
) {
  const batch = samples.length;
  const out = new Float32Array(batch * 3 * targetH * maxW);
  const dstPerChannel = targetH * maxW;
  for (let index = 0; index < batch; index += 1) {
    const sample = samples[index];
    const srcW = sample.width;
    const srcPerChannel = targetH * srcW;
    for (let channel = 0; channel < 3; channel += 1) {
      const srcBase = channel * srcPerChannel;
      const dstBase = index * (3 * dstPerChannel) + channel * dstPerChannel;
      for (let row = 0; row < targetH; row += 1) {
        const srcStart = srcBase + row * srcW;
        const dstStart = dstBase + row * maxW;
        out.set(sample.chw.subarray(srcStart, srcStart + srcW), dstStart);
      }
    }
  }
  return new ort.Tensor("float32", out, [batch, 3, targetH, maxW]);
}

function packRecBatchTensor(ort, samples, targetH) {
  const maxW = samples.reduce((acc, sample) => Math.max(acc, sample.width), 1);
  return createBatchTensor(ort, samples, maxW, targetH);
}

function decodeCTCSample(
  data,
  offset,
  timeSteps,
  classes,
  charDict
) {
  let prevIdx = -1;
  let text = "";
  const probs = [];
  for (let step = 0; step < timeSteps; step += 1) {
    let maxIdx = 0;
    let maxVal = -Infinity;
    const stepOffset = offset + step * classes;
    for (let cls = 0; cls < classes; cls += 1) {
      const value = data[stepOffset + cls];
      if (value > maxVal) {
        maxVal = value;
        maxIdx = cls;
      }
    }
    if (maxIdx > 0 && maxIdx !== prevIdx) {
      const dictIdx = maxIdx - 1;
      if (dictIdx >= 0 && dictIdx < charDict.length) {
        text += charDict[dictIdx];
        probs.push(maxVal);
      }
    }
    prevIdx = maxIdx;
  }
  const score = probs.length ? probs.reduce((a, b) => a + b, 0) / probs.length : 0;
  return { text, score };
}

function postprocess(output, charDict) {
  const dims = output.dims;
  if (dims.length !== 3) {
    throw new Error(`Unexpected rec output dims: [${dims.join(", ")}]`);
  }
  const sampleCount = dims[0];
  const timeSteps = dims[1];
  const classes = dims[2];
  const data = output.data;
  const stride = timeSteps * classes;
  const results = [];
  for (let index = 0; index < sampleCount; index += 1) {
    results.push(decodeCTCSample(data, index * stride, timeSteps, classes, charDict));
  }
  return results;
}

module.exports = {
  DEFAULT_REC_MODEL_PARSE_FALLBACKS,
  DEFAULT_REC_RUNTIME_LIMITS,
  DEFAULT_REC_MODEL_CONFIG,
  createRecModel,
  parseRecModelConfigText,
}
