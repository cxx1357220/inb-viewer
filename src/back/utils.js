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

export {
  throttle,
  times
}