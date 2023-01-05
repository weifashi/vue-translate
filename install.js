const fs = require("fs")
const INIT_CWD = process.env.INIT_CWD;

// 添加指令
var packagePath = INIT_CWD+'/package.json';
fs.readFile(packagePath,function(err, data) {
    if(err) throw err;
    var json = JSON.parse(data)
    json.scripts.translate = 'node node_modules/vue-translate/server.js';
    fs.writeFile(packagePath, JSON.stringify(json, null, 2), "utf8" ,function(err,result) {

    });
});

// 添加配置文件
fs.readFile('./translate.json',function(err, data) {
    if(err) throw err;
    fs.writeFile(INIT_CWD+'/translate.json', data, "utf8" ,function(err,result) {

    });
});
