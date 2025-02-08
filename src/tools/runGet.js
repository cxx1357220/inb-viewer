window.cheerio = require('cheerio');
const getDetail = async (obj) => {

    return new Promise((resolve, reject) => {
        function loadScript(url, callback) {
            var script = document.createElement('script');
            script.type = 'text/javascript';

            // 当脚本加载并执行完毕后执行的回调函数
            script.onload = function () {
                callback(); // 调用回调函数来执行方法
            };

            script.src = url; // 设置脚本的URL路径
            document.head.appendChild(script); // 将脚本添加到文档的头部
        }

        // 调用loadScript函数来加载脚本并执行方法
        let jsPath = localStorage.getItem('useGetJsPath')||localStorage.getItem('baseGetDetailPath')
        loadScript(jsPath, function () {
            console.log('jsPath: ', jsPath);
            resolve(run(obj));  
        });
    })


}

export default getDetail