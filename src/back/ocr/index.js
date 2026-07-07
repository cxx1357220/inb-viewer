
const ort = require('onnxruntime-node');
const path = require('path')

const { getOpenCv } = require("./opencv.js");
const Jimp = require('jimp');


const { createDetModel } = require("./det");
const { createRecModel } = require("./rec")
const { cropByPoly } = require("./crop")
const { nowMs } = require("./utils")
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
const DEFAULT_REC_MODEL_PARSE_FALLBACKS = Object.freeze({
  imageShape: [3, 48, 320],
  charDict: []
});
const defaultOcrConfig = {
  det: DEFAULT_DET_MODEL_PARSE_FALLBACKS,
  rec: DEFAULT_REC_MODEL_PARSE_FALLBACKS
}


/**
 * 简化版OCR处理器，移除了批量处理逻辑，专注于单个图像处理
 */
class SimpleOcrProcessor {

  constructor(ocrModelPath) {
    this.modelConfig = defaultOcrConfig;
    this.ocrModelPath = ocrModelPath;
    this.cv = null;
    this.ort = null;
    this.detModel = null;
    this.recModel = null;
    this.disposeTimeout = null;
  }
  async sourceToMat(cv, filePath) {
    console.log('filePath: ', filePath);

    var jimpSrc = await Jimp.default.read(filePath);
    var sourceMat = cv.matFromImageData(jimpSrc.bitmap);
    return {
      width: jimpSrc.bitmap.width,
      height: jimpSrc.bitmap.height,
      mat: sourceMat,
      dispose() {
        sourceMat.delete();
      }
    };
  }

  async initialize() {
    console.log('initialize');
    const { cv } = await getOpenCv();
    this.cv = cv;
    this.ort = ort;
    let ocrModelPath = this.ocrModelPath;
    const ocrRecModelYmlPath = path.join(ocrModelPath, 'inference-tiny-rec.yml')
    const ocrDetModelYmlPath = path.join(ocrModelPath, 'inference-tiny-det.yml')
    const ocrRecModelPath = path.join(ocrModelPath, 'inference-tiny-rec.onnx')
    const ocrDetModelPath = path.join(ocrModelPath, 'inference-tiny-det.onnx')


    await this.disposeModelsOnly();
    const detBatchSize = 1; // 固定为1，因为我们只处理单个图像
    const recBatchSize = 1; // 固定为1

    const [detModel, recModel] = await Promise.all([
      createDetModel({
        ort: this.ort,
        ocrDetModelPath,
        ocrDetModelYmlPath,
        batchSize: detBatchSize
      }),
      createRecModel({
        ort: this.ort,
        ocrRecModelPath,
        ocrRecModelYmlPath,
        batchSize: recBatchSize
      })
    ]);
    this.detModel = detModel;
    this.recModel = recModel;
    this.modelConfig = {
      det: this.detModel.config,
      rec: this.recModel.config
    };
  }



  /**
   * 处理单个图像的OCR
   */
  async predictSingle(input) {
    this.disposeTimeout && clearTimeout(this.disposeTimeout);
    if (!this.detModel || !this.recModel || !this.cv || !this.ort) {
      await this.initialize();
    }

    const cv = this.cv;
    const detModel = this.detModel;
    const recModel = this.recModel;
    if (!cv || !detModel || !recModel) {
      throw new Error("Initialization did not complete. Call initialize() first.");
    }

    const totalStart = nowMs();
    const config = this.modelConfig;
    const resolved = {
      det: {
        limitSideLen: config.det.resizeLong,
        limitType: config.det.limitType,
        maxSideLimit: config.det.maxSideLimit,
        thresh: config.det.postprocess.thresh,
        boxThresh: config.det.postprocess.boxThresh,
        unclipRatio: config.det.postprocess.unclipRatio
      },
      pipeline: {
        scoreThresh: 0
      }
    };
    console.log('input: ', input);

    // 将输入转换为Mat
    const sourceImage = await this.sourceToMat(cv, input);
    console.log('sourceImage: ', sourceImage);

    try {
      // 文本检测
      const detStart = nowMs();
      const detResults = await detModel.predict(
        cv,
        [sourceImage.mat], // 只处理单个图像
        resolved.det
      );
      const sumDetMs = nowMs() - detStart;

      // 文本识别
      const recStart = nowMs();
      const detBoxes = detResults[0].boxes || []; // 取第一个结果
      const cropMats = [];

      for (let boxIdx = 0; boxIdx < detBoxes.length; boxIdx += 1) {
        cropMats.push(cropByPoly(cv, sourceImage.mat, detBoxes[boxIdx].poly));
      }

      try {
        const recResults = cropMats.length ? await recModel.predict(cv, cropMats) : [];
        const items = [];

        for (let boxIdx = 0; boxIdx < recResults.length; boxIdx += 1) {
          const rec = recResults[boxIdx];
          if (rec.text && rec.score >= resolved.pipeline.scoreThresh) {
            items.push({
              poly: detBoxes[boxIdx].poly,
              text: rec.text,
              score: rec.score
            });
          }
        }

        const sumRecMs = nowMs() - recStart;
        const totalElapsed = nowMs() - totalStart;

        this.disposeTimeout = setTimeout(() => {
          this.dispose();
        }, 30000);
        return {
          image: {
            width: sourceImage.width,
            height: sourceImage.height
          },
          items,
          metrics: {
            detMs: sumDetMs,
            recMs: sumRecMs,
            totalMs: totalElapsed,
            detectedBoxes: detBoxes.length,
            recognizedCount: items.length
          }
        };
      } finally {
        // 清理裁剪的矩阵
        for (const mat of cropMats) {
          mat.delete();
        }
      }
    } finally {
      // 清理源图像
      sourceImage.dispose();
    }
  }

  async disposeModelsOnly() {
    console.log('disposeModelsOnly')
    let ls = []
    this.detModel && ls.push(this.detModel.dispose())
    this.recModel && ls.push(this.recModel.dispose())
    await Promise.all(ls);
    this.detModel = null;
    this.recModel = null;
  }

  async dispose() {
    await this.disposeModelsOnly();
  }
}



// process.on('message', function (obj) {
//   try {
//     const ocr = new SimpleOcrProcessor(obj.ocrModelPath);
//     ocr.initialize().then(() => {
//       ocr.predictSingle(obj.filePath).then(res => {
//         process.send(res)
//         ocr.dispose()
//       })
//     })
//   } catch (error) {
//     process.send({
//       error: error
//     })
//   }
// })
module.exports = { SimpleOcrProcessor };