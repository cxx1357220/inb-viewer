const fs = require('fs')
const { execSync } = require('child_process')
const input_file = "./main.cpp",
    output_file = "./node_modules/electron-as-wallpaper/lib/main.cpp",
    module_path = "./node_modules/electron-as-wallpaper"
fs.access(module_path, fs.constants.F_OK, (err) => {
    if (err) {
        console.error('文件不存在');
    } else {
        // 读取文件内容
        fs.readFile(input_file, 'utf8', (err, data) => {
            if (err) {
                console.error(err);
                return;
            }
            // 写入到另一个文件
            fs.writeFile(output_file, data, (err) => {
                if (err) {
                    console.error(err);
                    return;
                }
                console.log('文件已被复制。');
                try {
                    execSync(`cd ${module_path}  && npm run gyp:rebuild`, {
                        
                        stdio: 'ignore',
                        shell: true
                    })
                    console.log( `cd ${module_path}  && npm run gyp:rebuild`);
                    console.log('rebuild .node done!');
                } catch (error) {
                    console.log('error: ', error);

                }


            });
        });
    }
});

