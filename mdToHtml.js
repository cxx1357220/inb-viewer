let MarkdownIt = require('markdown-it'),
    md = new MarkdownIt(),
    fs = require('fs');
let content = fs.readFileSync('./help.md', 'utf-8');
var result = md.render(content);
let html = '<template><div class="markdown-body">' + result.toString() + '</div></template>'
let css = '<style scoped src="../assets/markdown.css"></style>\
            <style scoped >\
                .markdown-body {\
                    padding: 20px;\
                }\
            </style>'
let js = "<script>\
const { shell } = require('electron');\
window.onload=()=>{\
    const links = document.querySelectorAll('a[href]');\
    console.log(links);\
    links.forEach(link => {\
        link.addEventListener('click', e => {\
            const url = link.getAttribute('href');\
            e.preventDefault();\
            shell.openExternal(url);\
        });\
    });\
}\
</script>"
fs.writeFileSync('./src/views/help.vue', html + css + js)