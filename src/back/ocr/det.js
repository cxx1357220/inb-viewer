


const { releaseSessions } = require("./ort");
const { chunkArray, clamp, resolveRuntimeBatchSize } = require("./utils");
const { runInference } = require("./infer");
const {
  boxScoreFast,
  getMiniBoxFromPoints,
  getTransformOp,
  parseScaleValue,
  toBgrFloatCHWFromBgr,
  parseInferenceConfigText,
  unclip
} = require("./common");



const DET_BOX_MIN_SIZE = 3;

const DEFAULT_DET_MODEL_PARSE_FALLBACKS = Object.freeze({
  resizeLong: 960,
  limitType: "max",
  maxSideLimit: 4000,
  normalize: {
    mean: [0.485, 0.456, 0.406],
    std: [0.229, 0.224, 0.225],
    scale: 1 / 255
  },
  postprocess: {
    thresh: 0.3,
    boxThresh: 0.6,
    maxCandidates: 1000,
    unclipRatio: 2.0
  }
});

const DEFAULT_DET_MODEL_CONFIG = Object.freeze({
  ...DEFAULT_DET_MODEL_PARSE_FALLBACKS
});

function parseDetLimitType(raw) {
  const v = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (v === "min" || v === "max") {
    return v;
  }
  return DEFAULT_DET_MODEL_PARSE_FALLBACKS.limitType;
}

function parseDetModelConfigText(ocrDetModelYmlPath) {
  const parsed = parseInferenceConfigText(ocrDetModelYmlPath)
  const preProcess = parsed.PreProcess;
  const transformOps = preProcess.transform_ops;
  const resize = getTransformOp(transformOps, "DetResizeForTest")||{};
  const normalize = getTransformOp(transformOps, "NormalizeImage")||{};
  const postprocess = (parsed.PostProcess || {});

  const maxSideRaw = resize.max_side_limit;
  const maxSideLimit = Number(maxSideRaw);
  const maxSide =
    Number.isFinite(maxSideLimit) && maxSideLimit > 0
      ? maxSideLimit
      : DEFAULT_DET_MODEL_PARSE_FALLBACKS.maxSideLimit;

  return {
    resizeLong: Number(resize.resize_long || DEFAULT_DET_MODEL_PARSE_FALLBACKS.resizeLong),
    limitType: parseDetLimitType(resize.limit_type),
    maxSideLimit: maxSide,
    normalize: {
      mean:
        (normalize.mean) ||
        DEFAULT_DET_MODEL_PARSE_FALLBACKS.normalize.mean,
      std:
        (normalize.std) || DEFAULT_DET_MODEL_PARSE_FALLBACKS.normalize.std,
      scale: parseScaleValue(normalize.scale, DEFAULT_DET_MODEL_PARSE_FALLBACKS.normalize.scale)
    },
    postprocess: {
      thresh: Number(postprocess.thresh || DEFAULT_DET_MODEL_PARSE_FALLBACKS.postprocess.thresh),
      boxThresh: Number(
        postprocess.box_thresh || DEFAULT_DET_MODEL_PARSE_FALLBACKS.postprocess.boxThresh
      ),
      maxCandidates: Number(
        postprocess.max_candidates || DEFAULT_DET_MODEL_PARSE_FALLBACKS.postprocess.maxCandidates
      ),
      unclipRatio: Number(
        postprocess.unclip_ratio || DEFAULT_DET_MODEL_PARSE_FALLBACKS.postprocess.unclipRatio
      )
    }
  };
}


function resolveDetParams(
  defaults,
  overrides
) {
  return {
    limitSideLen: overrides.limitSideLen || defaults.limitSideLen,
    limitType: overrides.limitType || defaults.limitType,
    maxSideLimit: overrides.maxSideLimit || defaults.maxSideLimit,
    thresh: overrides.thresh || defaults.thresh,
    boxThresh: overrides.boxThresh || defaults.boxThresh,
    unclipRatio: overrides.unclipRatio || defaults.unclipRatio
  };
}

async function createDetModel({
  ort,
  ocrDetModelPath,
  ocrDetModelYmlPath,
  batchSize: batchSizeArg
}) {
  const config = parseDetModelConfigText(ocrDetModelYmlPath);
  const defaultBatchSize = Math.max(1, batchSizeArg || 1);
  const defaultParams = {
    limitSideLen: config.resizeLong,
    limitType: config.limitType,
    maxSideLimit: config.maxSideLimit,
    thresh: config.postprocess.thresh,
    boxThresh: config.postprocess.boxThresh,
    unclipRatio: config.postprocess.unclipRatio
  };
  let session = await ort.InferenceSession.create(ocrDetModelPath);


  return {
    kind: "det",
    config,
    async predict(cv, mats, overrides = {}) {
      const params = resolveDetParams(defaultParams, overrides);
      const batchSize = resolveRuntimeBatchSize(overrides.batchSize, defaultBatchSize);
      const results = [];
      const runCtx = {
        cv,
        ort,
        config,
        session
      };
      for (const chunk of chunkArray(mats, batchSize)) {
        const preps = preprocess({ cv, ort, config }, chunk, params);
        const inputTensor = packDetBatchTensor(ort, preps);
        const fullOutput = await runInference(session, inputTensor);
        const internals = postprocess(runCtx, fullOutput, preps, params);
        for (const internal of internals) {
          results.push({
            boxes: internal.boxes,
            srcW: internal.prep.srcW,
            srcH: internal.prep.srcH
          });
        }
      }
      return results;
    },
    async dispose() {
      await releaseSessions(session);
      session = null;
    }
  };
}



function preprocess(
  context,
  mats,
  params
) {
  return mats.map((mat) => preprocessSample(context, mat, params));
}

function preprocessSample(
  context,
  sourceMat,
  params
) {
  const { cv, ort, config } = context;
  const srcW = sourceMat.cols;
  const srcH = sourceMat.rows;
  const limitSideLen = Math.max(32, params.limitSideLen);
  const limitType = params.limitType;
  const maxSideLimit = Math.max(32, params.maxSideLimit);
  let scale = 1.0;
  if (limitType === "max") {
    const maxSide = Math.max(srcW, srcH);
    if (maxSide > limitSideLen) {
      scale = limitSideLen / Math.max(1, maxSide);
    }
  } else {
    const minSide = Math.min(srcW, srcH);
    if (minSide < limitSideLen) {
      scale = limitSideLen / Math.max(1, minSide);
    }
  }
  let dstW = Math.max(32, Math.round((srcW * scale) / 32) * 32);
  let dstH = Math.max(32, Math.round((srcH * scale) / 32) * 32);
  if (Math.max(dstW, dstH) > maxSideLimit) {
    const limitScale = maxSideLimit / Math.max(dstW, dstH);
    dstW = Math.max(32, Math.floor(dstW * limitScale));
    dstH = Math.max(32, Math.floor(dstH * limitScale));
  }
  dstW = clamp(dstW, 32, maxSideLimit);
  dstH = clamp(dstH, 32, maxSideLimit);
  dstW = Math.max(32, Math.round(dstW / 32) * 32);
  dstH = Math.max(32, Math.round(dstH / 32) * 32);

  const resized = new cv.Mat();
  const bgr = new cv.Mat();
  cv.resize(sourceMat, resized, new cv.Size(dstW, dstH), 0, 0, cv.INTER_LINEAR);
  if (resized.channels() === 4) {
    cv.cvtColor(resized, bgr, cv.COLOR_RGBA2BGR);
  } else if (resized.channels() === 1) {
    cv.cvtColor(resized, bgr, cv.COLOR_GRAY2BGR);
  } else {
    resized.copyTo(bgr);
  }
  const chw = toBgrFloatCHWFromBgr(bgr.data, dstW, dstH, config.normalize);
  resized.delete();
  bgr.delete();

  return {
    tensor: new ort.Tensor("float32", chw, [1, 3, dstH, dstW]),
    srcW,
    srcH,
    dstW,
    dstH
  };
}

function getDetMap(outputTensor) {
  const dims = outputTensor.dims;
  const data = outputTensor.data;
  if (dims.length === 4) return { data, h: dims[2], w: dims[3] };
  if (dims.length === 3) return { data, h: dims[1], w: dims[2] };
  throw new Error(`Unexpected det output dims: [${dims.join(", ")}]`);
}

function createBatchDetTensor(
  ort,
  preps,
  maxH,
  maxW
) {
  const batch = preps.length;
  const plane = 3 * maxH * maxW;
  const out = new Float32Array(batch * plane);
  for (let i = 0; i < batch; i += 1) {
    const prep = preps[i];
    const chw = prep.tensor.data;
    const { dstH, dstW } = prep;
    const base = i * plane;
    for (let c = 0; c < 3; c += 1) {
      const srcChannelBase = c * dstH * dstW;
      const dstChannelBase = base + c * maxH * maxW;
      for (let y = 0; y < dstH; y += 1) {
        const srcRow = srcChannelBase + y * dstW;
        const dstRow = dstChannelBase + y * maxW;
        out.set(chw.subarray(srcRow, srcRow + dstW), dstRow);
      }
    }
  }
  return new ort.Tensor("float32", out, [batch, 3, maxH, maxW]);
}

function packDetBatchTensor(ort, preps) {
  const maxH = Math.max(...preps.map((p) => p.dstH));
  const maxW = Math.max(...preps.map((p) => p.dstW));
  return createBatchDetTensor(ort, preps, maxH, maxW);
}

function batchDetOutputPlaneOffset(dims, batchIndex) {
  const tail = dims.slice(1).reduce((a, b) => a * b, 1);
  return batchIndex * tail;
}

function detFeatureCropDims(
  dstH,
  dstW,
  maxH,
  maxW,
  ohFull,
  owFull
) {
  const cropOh = Math.max(1, Math.min(ohFull, Math.round((ohFull * dstH) / maxH)));
  const cropOw = Math.max(1, Math.min(owFull, Math.round((owFull * dstW) / maxW)));
  return { cropOh, cropOw };
}

function sliceBatchedDetOutputPlane(
  ort,
  fullOutput,
  batchIndex,
  cropOh,
  cropOw,
  ohFull,
  owFull
) {
  const data = fullOutput.data;
  const dims = fullOutput.dims;
  const base = batchDetOutputPlaneOffset(dims, batchIndex);
  const out = new Float32Array(cropOh * cropOw);
  for (let r = 0; r < cropOh; r += 1) {
    const rowStart = base + r * owFull;
    out.set(data.subarray(rowStart, rowStart + cropOw), r * cropOw);
  }
  return new ort.Tensor("float32", out, [1, 1, cropOh, cropOw]);
}

function postprocess(
  context,
  fullOutput,
  preps,
  params
) {
  const { cv, ort, config } = context;
  const od = fullOutput.dims;
  if (od.length !== 3 && od.length !== 4) {
    throw new Error(`Unexpected det output dims: [${od.join(", ")}]`);
  }
  const ohFull = od.length === 4 ? od[2] : od[1];
  const owFull = od.length === 4 ? od[3] : od[2];
  const nOut = od.length === 4 ? od[0] : preps.length === 1 ? 1 : od[0];
  if (nOut !== preps.length) {
    throw new Error(
      `Detection batch output N=${String(nOut)} does not match input batch ${String(preps.length)}`
    );
  }

  const maxH = Math.max(...preps.map((p) => p.dstH));
  const maxW = Math.max(...preps.map((p) => p.dstW));

  const items = [];
  for (let i = 0; i < preps.length; i += 1) {
    const prep = preps[i];
    const { cropOh, cropOw } = detFeatureCropDims(prep.dstH, prep.dstW, maxH, maxW, ohFull, owFull);
    const planeTensor = sliceBatchedDetOutputPlane(
      ort,
      fullOutput,
      i,
      cropOh,
      cropOw,
      ohFull,
      owFull
    );
    const boxes = decodeDetOutput(
      { cv, config },
      planeTensor,
      prep,
      params.thresh,
      params.boxThresh,
      params.unclipRatio
    );
    items.push({ prep, boxes });
  }
  return items;
}

function decodeDetOutput(
  context,
  detOutput,
  meta,
  detThresh,
  boxThresh,
  unclipRatio
) {
  const { cv, config } = context;
  const { data, h, w } = getDetMap(detOutput);
  const pred = cv.matFromArray(h, w, cv.CV_32FC1, data);
  const maskData = new Uint8Array(h * w);
  for (let i = 0; i < data.length; i += 1) {
    maskData[i] = data[i] > detThresh ? 255 : 0;
  }
  const bitmap = cv.matFromArray(h, w, cv.CV_8UC1, maskData);
  const contours = new cv.MatVector();
  const hierarchy = new cv.Mat();
  cv.findContours(bitmap, contours, hierarchy, cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE);

  const boxes = [];
  const candidateCount = Math.min(config.postprocess.maxCandidates, contours.size());
  for (let i = 0; i < candidateCount; i += 1) {
    const contour = contours.get(i);
    if (contour.rows < 4) {
      contour.delete();
      continue;
    }
    const points = [];
    for (let row = 0; row < contour.rows; row += 1) {
      points.push([contour.data32S[row * 2], contour.data32S[row * 2 + 1]]);
    }
    const mini = getMiniBoxFromPoints(cv, points);
    if (mini.side < DET_BOX_MIN_SIZE) {
      contour.delete();
      continue;
    }
    const score = boxScoreFast(cv, pred, mini.box);
    if (score < boxThresh) {
      contour.delete();
      continue;
    }
    const expanded = unclip(mini.box, unclipRatio);
    if (!expanded || expanded.length < 4) {
      contour.delete();
      continue;
    }
    const miniUnclip = getMiniBoxFromPoints(cv, expanded);
    if (miniUnclip.side < DET_BOX_MIN_SIZE + 2) {
      contour.delete();
      continue;
    }

    const poly = miniUnclip.box.map((point) => [
      clamp(Math.round((point[0] * meta.srcW) / Math.max(1, w)), 0, meta.srcW),
      clamp(Math.round((point[1] * meta.srcH) / Math.max(1, h)), 0, meta.srcH)
    ]);
    boxes.push({ poly, score });
    contour.delete();
  }

  pred.delete();
  bitmap.delete();
  contours.delete();
  hierarchy.delete();

  boxes.sort((a, b) => a.poly[0][1] - b.poly[0][1] || a.poly[0][0] - b.poly[0][0]);
  for (let i = 0; i < boxes.length - 1; i += 1) {
    for (let j = i; j >= 0; j -= 1) {
      if (
        Math.abs(boxes[j + 1].poly[0][1] - boxes[j].poly[0][1]) < 10 &&
        boxes[j + 1].poly[0][0] < boxes[j].poly[0][0]
      ) {
        const tmp = boxes[j];
        boxes[j] = boxes[j + 1];
        boxes[j + 1] = tmp;
      } else {
        break;
      }
    }
  }

  return boxes;
}

module.exports = {
  DEFAULT_DET_MODEL_PARSE_FALLBACKS,
  DEFAULT_DET_MODEL_CONFIG,
  parseDetModelConfigText,
  createDetModel
};