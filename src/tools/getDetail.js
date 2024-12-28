const cheerio = require('cheerio');
const baseUrl = 'https://www.imdb.com/'
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
            return false
        });
}
const getDetail =async (obj) => {
    let url = await searchTitle(obj)
    console.log('url: ', url);
    if(!url){
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
            let previewImg = $('.ipc-media--dynamic>img').map(function (i, el) {
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
                    videoPreviewImg: previewImg
                }
            }
        })
}

export default getDetail