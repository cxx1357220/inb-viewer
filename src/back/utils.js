/**
 * 节流
 * @param {Function} fn 执行function
 * @param {Number} delay 时间
 * @returns 
 */
const throttle = (fn, delay = 1000) => {
  //距离上一次的执行时间
  let lastTime = 0
  return function () {
    let _this = this
    let _arguments = arguments
    let now = new Date().getTime()
    //如果距离上一次执行超过了delay才能再次执行
    if (now - lastTime > delay) {
      fn.apply(_this, _arguments)
      lastTime = now
    }
  }
}

/**
 * 时间转换
 * @param {String} t 
 * @returns {Number}
 */
const times = (t) => {
  let l = t.split(':')
  return Number(l[0] * 3600) + Number(l[1] * 60) + Number(l[2])
}

/**
 * 时间转成秒数
 * @param {string} durationStr 
 * @returns {number} 秒数
 */
function durationToSeconds(durationStr) {
    const [hms, ms] = durationStr.split('.');
    const [h, m, s] = hms.split(':').map(Number);
    return h * 3600 + m * 60 + s + Number(ms) / 100;
}



/**
 * 防抖
 * @param {Function} func 
 * @param {Number} wait 
 * @returns 
 */
function debounce(func, wait) {
    let timeout;
    return function () {
        const context = this;
        const args = arguments;
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            func.apply(context, args);
        }, wait);
    };
}

function randomKey(len=2) {
  let key = ''
  for (let i = 0; i < len; i++) {
    key+=String.fromCharCode(Math.floor(Math.random() * 26) + 97) 
  }
  return key
}

export {
  throttle,
  times,
  durationToSeconds,
  debounce,
  randomKey
}