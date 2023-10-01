let {
   winSend
} = require('./win')
/**
 * 重写log，输出到web log
 */
console.log = function () {
    console.warn(...arguments)
    winSend('main','log', ...arguments)
}
export default console.log