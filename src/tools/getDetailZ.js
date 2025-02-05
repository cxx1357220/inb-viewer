const cheerio = require('cheerio');
let map = {}
const requestOptions = {
    method: "GET",
    redirect: "follow"
};
const getMap = () => {
    let mapPath = localStorage.getItem('mapPath')
    if (!mapPath) {
        return false
    }
    let str = fs.readFileSync(mapPath, 'utf8')
    map = JSON.parse(str)
    return true
}


const libPic4 = async (c) => {
    let code = c.replace('-', '').toLowerCase()
    return {
        videoBigImage: `${map['baseUrl2']}${code}/${code}js.jpg`,
        videoMinImage: `${map['baseUrl2']}${code}/${code}js.jpg`
    }
}
const libPic3 = async (c) => {
    let code = c.replace('-', '').toLowerCase()
    let before = code.split('-')[0].toLocaleLowerCase()
    if (map[before]) {
        code = map[before] + code
    }
    let minImage = `${map['baseUrl3']}${code}/${code}ps.jpg`
    let res = await fetch(minImage, requestOptions)
    if (res.redirected) {
        return libPic4(c)
    }
    return {
        videoBigImage: `${map['baseUrl3']}${code}/${code}pl.jpg`,
        videoMinImage: minImage
    }
}
const libPic2 = async (c) => {
    let code = c.replace('-', '').toLowerCase()
    let minImage = `${map['baseUrl2']}${code}/${code}jp.jpg`
    let res = await fetch(minImage, requestOptions)
    if (res.redirected) {
        return await libPic3(c)
    }
    return {
        videoBigImage: `${map['baseUrl2']}${code}/${code}jp.jpg`,
        videoMinImage: minImage
    }
}
const libPic = async (c) => {
    let code = c.replace('-', '').toLowerCase()
    let before = code.split('-')[0].toLocaleLowerCase()
    if (map[before]) {
        code = map[before] + code
    }
    let minImage = `${map['baseUrl']}${code}/${code}ps.jpg`
    let res = await fetch(minImage, requestOptions)
    if (res.redirected) {
        return await libPic2(c)
    }
    return {
        videoBigImage: `${map['baseUrl']}${code}/${code}pl.jpg`,
        videoMinImage: minImage
    }
}



const getDetail = async (obj, more = false) => {
    let outUrl = map['library']
    if (!outUrl) {
        let bool = getMap()
        outUrl = map['library']
        if (!bool) {
            return Promise.reject('error map path')
        }
    }
    var patt1 = /[a-zA-Z][a-zA-Z0-9]*-[0-9]+/;
    let code = obj.title.match(patt1)?.[0].toLocaleUpperCase();
    if (!code) {
        return Promise.reject('error code')
    }



    return fetch(outUrl + code + '/', requestOptions)
        .then((response) => response.text())
        .then(async (result) => {
            const $ = cheerio.load(result);
            let title = $('header>h1').text()
            let tags = $('#video-desc>a').map(function (i, el) {
                return $(this).text();
            }).get();
            let bigImage = $('#video-info a.glightbox1').attr('href')
            let minImage = $('#video-info a>img').attr('data-original')
            let acts = $('#video-info a.btn-outline-danger').map(function (i, el) {
                return $(this).text()
            }).get();
            let previewImg = $('#preview-img a').map(function (i, el) {
                return $(this).attr('href')
            }).get();

            if (!title) {
                if (more) {
                    let oo = await libPic(code)
                    return oo
                } else {
                    return Promise.reject('error name')
                }
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