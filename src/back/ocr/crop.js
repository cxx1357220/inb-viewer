
const { distance2 } = require("./utils");
function orderQuad(pts) {
  const points = pts.slice().sort((a, b) => a[0] - b[0]);
  let indexA;
  let indexB;
  let indexC;
  let indexD;
  if (points[1][1] > points[0][1]) {
    indexA = 0;
    indexD = 1;
  } else {
    indexA = 1;
    indexD = 0;
  }
  if (points[3][1] > points[2][1]) {
    indexB = 2;
    indexC = 3;
  } else {
    indexB = 3;
    indexC = 2;
  }
  return [points[indexA], points[indexB], points[indexC], points[indexD]];
}
function getMiniBoxFromPoints(cv, points) {
  const flat = [];
  for (const p of points) flat.push(p[0], p[1]);
  const contour = cv.matFromArray(points.length, 1, cv.CV_32FC2, flat);
  const rect = cv.minAreaRect(contour);
  const vertices = cv.RotatedRect.points(rect);
  const box = [];
  for (let i = 0; i < 4; i += 1) box.push([vertices[i].x, vertices[i].y]);
  contour.delete();
  const ordered = orderQuad(box);
  const side = Math.min(distance2(ordered[0], ordered[1]), distance2(ordered[1], ordered[2]));
  return { box: ordered, side };
}
function cropByPoly(cv, srcMat, poly) {
  const ordered = getMiniBoxFromPoints(cv, poly).box;
  const widthTop = Math.hypot(ordered[1][0] - ordered[0][0], ordered[1][1] - ordered[0][1]);
  const widthBottom = Math.hypot(ordered[2][0] - ordered[3][0], ordered[2][1] - ordered[3][1]);
  const heightLeft = Math.hypot(ordered[3][0] - ordered[0][0], ordered[3][1] - ordered[0][1]);
  const heightRight = Math.hypot(ordered[2][0] - ordered[1][0], ordered[2][1] - ordered[1][1]);
  const cropW = Math.max(1, Math.floor(Math.max(widthTop, widthBottom)));
  const cropH = Math.max(1, Math.floor(Math.max(heightLeft, heightRight)));

  const srcTri = cv.matFromArray(4, 1, cv.CV_32FC2, [
    ordered[0][0],
    ordered[0][1],
    ordered[1][0],
    ordered[1][1],
    ordered[2][0],
    ordered[2][1],
    ordered[3][0],
    ordered[3][1]
  ]);
  const dstTri = cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, cropW, 0, cropW, cropH, 0, cropH]);
  const transform = cv.getPerspectiveTransform(srcTri, dstTri);
  const warped = new cv.Mat();
  cv.warpPerspective(
    srcMat,
    warped,
    transform,
    new cv.Size(cropW, cropH),
    cv.INTER_CUBIC,
    cv.BORDER_REPLICATE,
    new cv.Scalar()
  );
  srcTri.delete();
  dstTri.delete();
  transform.delete();

  if (warped.rows / Math.max(1, warped.cols) >= 1.5) {
    const rotated = new cv.Mat();
    cv.rotate(warped, rotated, cv.ROTATE_90_COUNTERCLOCKWISE);
    warped.delete();
    return rotated;
  }
  return warped;
}
module.exports = {
  getMiniBoxFromPoints,
  cropByPoly
}