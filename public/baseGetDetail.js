// 默认使用这个脚本来获取信息，也可以自己写。记得点击右上角保存和使用按钮。
// 自带的cheerio包，如需别的包，可以通过document.createElement('script')引入
// window.cheerio = require('cheerio');
const baseUrl = 'https://www.imdb.com/'
/**
 * 根据title获取数据连接
 * @param {object} obj 块数据
 * @returns {String} 内容详情的链接
 */
const searchTitle = (obj) => {
    let title = obj.title
    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };
    return fetch(`${baseUrl}find/?q=${title}`, requestOptions)
        .then((response) => response.text())
        .then((result) => {
            const $ = cheerio.load(result);
            let url = $('a.ipc-metadata-list-summary-item__t').attr('href')
            return url
        })
        .catch((error) => {
            console.log('error: ', error);
            return false
        });
}


/**
 * 返回值的结构
 * @typedef {Object} Returns
 * @property {string} videoCode - 片码
 * @property {string} videoTitle - 片名
 * @property {string} videoBigImage - 视频大图的url
 * @property {string} videoMinImage - 视频小图的url
 * @property {string[]} videoTags - 视频类型
 * @property {string[]} videoActs - 主演
 * @property {string[]} videoPreviewImgs - 视频预览图URL
 * @property {any} moreDetail - 更多信息，推荐{}，方便扩展
 */
 
/**
 * 执行函数，名称必须为run，返回值resolve只允许Returns，多了属性也不会存进去。
 * @param {object} obj 块数据
 * @returns {Promise<Returns>}
 */
const run = async (obj) => {
    let url = await searchTitle(obj)
    console.log('url: ', url);
    if (!url) {
        return Promise.reject('error name')
    }

    const requestOptions = {
        method: "GET",
        redirect: "follow"
    };

    return fetch(`${baseUrl}${url}`, requestOptions)
        .then((response) => response.text())
        .then((result) => {
            const $ = cheerio.load(result);
            let title = obj.title
            let code = $('[property="imdb:pageConst"]').attr('content');
            let tags = $('.ipc-chip--on-baseAlt>span').map(function (i, el) {
                return $(this).text();
            }).get();
            let bigImage = $('img.ipc-image').attr('src')
            let minImage = $('img.ipc-image').attr('src')
            let acts = $('[data-testid="title-cast-item__actor"]').map(function (i, el) {
                return $(this).text()
            }).get();
            let previewImgs = $('.ipc-media--dynamic>img').map(function (i, el) {
                return $(this).attr('src')
            }).get();

            if (!code) {
                return Promise.reject('error name')
            } else {
                return {
                    videoCode: code,
                    videoTitle: title,
                    videoTags: tags,
                    videoBigImage: bigImage,
                    videoMinImage: minImage,
                    videoActs: acts,
                    videoPreviewImgs: previewImgs
                }
            }
        })
}