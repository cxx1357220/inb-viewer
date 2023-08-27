let {
   winSend
} = require('./win')
/**
 * 重写log
 */
console.log = function () {
    console.warn(...arguments)
    winSend('main','log', ...arguments)
}
export default console.log