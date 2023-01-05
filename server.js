const fs = require("fs")
const path = require('path'); 
const request = require('sync-request');
const crypto = require('crypto');
const log = require('single-line-log').stderr;
const arguments = process.argv; 
const INIT_CWD = process.env.INIT_CWD;

var config  = {};
try {
    config = fs.readFileSync(INIT_CWD+'/translate.json')+'';
    config = JSON.parse(config);
} catch (error) {
    
}

// 参数
var appKey = config.appKey || '';                   //翻译api 应用key    
var secretKey = config.secretKey || '';             //翻译api 密钥
var translateModel = config.translateModel || 1;    // 翻译模式： 1-i18n, 2-海豚有海的格式
var channel = config.channel || 'google';           // 翻译渠道： youdao 有道, google 谷歌
var languageList = config.languageList || [         // 翻译语言
    "CN",
    "EN",
    "TC"
];
var filePath = config.filePath ? (config.filePath == './' ? INIT_CWD : (INIT_CWD + config.filePath)) : INIT_CWD;    // 需要翻译的目录
var targetPath = config.targetPath ? (config.targetPath == './' ? INIT_CWD : (INIT_CWD + config.targetPath)) : '';  // 目标地址
var excludes = config.excludes || [                   // 排除翻译的目录
    'node_modules',
    'vendor',
    'build',
    'dist',
    '.git',
    '.vscode',
    'storage',
    'public',
    'language',
    'database',
    'lang'
];
var fileSuffix = config.fileSuffix || [              // 指定翻译的文件后缀
    '.vue',
    '.html',
    '.js',
    '.ts',
    '.php',
];

// 判断
if(channel == 'youdao'){
    if(!appKey){
        console.error('\033[41;31m请配置appKey\033[0m');
        return false;
    }
    if(!secretKey){
        console.error('\033[41;31m请配置secretKey\033[0m');
        return false;
    }
}
if(!languageList[0]){
    console.error('\033[41;31m请配置languageList\033[0m');
    return false;
}

// 判断 targetPath
if(!targetPath){
    readFileList(filePath,[],false).forEach(file=>{ 
        if(!targetPath && translateModel == 1 && file.indexOf('/i18n') !== -1 ){
            var files = file.split('/');
            targetPath = file.replace('/'+ files[ files.length - 1 ], '') 
        }
        if(!targetPath && translateModel == 2 && file.indexOf('language.js') !== -1){
            targetPath = file;
        }
    });
    // 
    if(!targetPath){
        console.error('\033[41;31m请配置targetPath\033[0m');
        return false;
    }
}else{
    var stat = '';
    try {
        stat = fs.statSync(targetPath); 
    } catch (error) {}
    if(!stat){
        console.error('\033[41;31m targetPath 错误，找不到 \033[0m');
        return false;
    }
    if(translateModel == 2 && stat.isDirectory() ){
        console.error('\033[41;31m targetPath 错误，必须是文件 \033[0m');
        return false;
    }
    if(translateModel == 1 && !stat.isDirectory() ){
        console.error('\033[41;31m targetPath 错误，必须是目录 \033[0m');
        return false;
    }
}

// 获取中文文件
var chinese = '';
if(translateModel == 1){
    if(languageList.indexOf('CN') !== -1  || languageList.indexOf('cn') !== -1){
        chinese = 'cn.json';
    }else if(languageList.indexOf('zh') !== -1  || languageList.indexOf('zh') !== -1){
        chinese = 'zh.json';
    }else{
        chinese = 'zh.json';
        languageList.push('zh');
    }
}

// 开始翻译
try {
    var resultTexts = [];
    var argumentText = arguments[2];    // 控制台参数 
    var translateTexts = getTranslateText(filePath, argumentText ? [argumentText] : []);
    var length = translateTexts.length;
    log(`=----------0%---------0/${length} `);
    translateTexts.forEach((text,index) => {
        resultTexts.push( translate(text,languageList,channel) );
        var dd = (((index+1) / length) * 100).toFixed(2);
        log(`=----------${dd}%---------${index+1}/${length}  `);
    });
    log(`=----------100%---------${length}/${length}  翻译完成`);
    console.log('');
    if(translateModel=='2'){
        resultTexts = getWebLanguage(targetPath).concat(resultTexts);
        resultTexts = JSON.stringify(resultTexts);
        resultTexts = resultTexts.replace("[{", "[\n   {");
        resultTexts = resultTexts.replace(/},{/g, "},\n   {");
        resultTexts =  resultTexts.replace("}]", "}\n]");
        resultTexts = ((fs.readFileSync(targetPath)+'').indexOf('exports.default=') == -1 ? "export default " : "exports.default=") + resultTexts;
        fs.writeFile(targetPath,resultTexts,function(err,result) {});
    }else{
        resultTexts.forEach(resultText=>{ 
            var key  = '';
            resultText.forEach(h=>{ 
                if(h.key=='CN' || h.key == 'cn' ||  h.key == 'zh' ||  h.key == 'ZH'){
                    key = h.value;
                }
            })
            resultText.forEach(h=>{ 
                var contents = {};
                var path = targetPath+"/"+(h.key).toLowerCase() + '.json';
                try {
                    contents = (fs.readFileSync(path));
                    contents = JSON.parse(contents+'');
                } catch (error) { }  
                contents[key] = h.value;
                fs.writeFileSync(path, JSON.stringify(contents,null,4));
            })
        })
    }
} catch (e) {
    log('');
}


/**
 * 获取web已有语言
 *
 * @return array
 */
function getWebLanguage(targetPath)
{   
    try {
        var contents = fs.readFileSync(targetPath)+'';
        contents = contents.replace('export default', '');
        contents = contents.replace('exports.default=', '');
        contents = contents.replace('exports.default =', '');
        contents = contents.replace('exports.default  =', '');
        contents = contents.replace('exports.default   =', '');
        contents = contents.replace(/\n/g, '');
        contents = contents.replace(/,   /g, ",");
        contents = contents.replace(/,    /g, ",");
        contents = contents.replace(/,     /g, ",");
        contents = contents.replace(/,      /g, ",");
        contents = contents.replace(/,       /g, ",");
        contents = contents.replace(/\\ n/g, "");
        contents = contents.replace(/,\n\n\n]/g, "]");
        contents = contents.replace(/,\n\n]/g, "]");
        contents = contents.replace(/,\n]/g, "]");
        contents = contents.replace(/,]/g, "]");
        contents = contents.replace(/];/g, "]");
        contents = JSON.parse(contents);
        return contents;
    } catch (error) {
        return [];
    }
}

/**
 * 获取所有待翻译内容
 * @param filePath 需要遍历的文件路径
 */  
function getTranslateText(filePath,texts=[]){
    translateTexts = texts || [];
    if(!translateTexts[0]){
        readFileList(filePath).forEach(function (item, index) {
            var contents = fs.readFileSync(item)+'';
            // 
            var match1 = contents.match(/('|")([\u4e00-\u9fa5]+[\u4e00-\u9fa5]+(!|！|。|？|\...|\......))/g)
            if(!match1)  match1 = [];
            // 
            var match2 = contents.match(/('|")([\u4e00-\u9fa5]+(，|,|-|、|：|:|\/|\||[0-9])+[\u4e00-\u9fa5]+(!|！|。|？|\...|\......))/g)
            if(!match2)  match2 = [];
            // 
            var match3 = contents.match(/('|")([\u4e00-\u9fa5]+(，|,|-|、|：|:|\/|[0-9])+[\u4e00-\u9fa5]+(，|,|-|、|：|:|\/|[0-9])+[\u4e00-\u9fa5]+(!|！|。|？|\...|\......))/g)
            if(!match3)  match3 = [];
            // 
            var match4 = contents.match(/('|")([\u4e00-\u9fa5]+(!|！|。|？|\...|\......))/g)
            if(!match4)  match4 = [];
            // 
            var match5 = contents.match(/(?<=')(\w)*([\u4e00-\u9fa5]+)(\.|，|,|-|、|：|:|\/|[0-9])*(?=')/g)
            if(!match5) match5 = [];
            // 
            var match6 = contents.match(/(?<=")(\w)*([\u4e00-\u9fa5]+)(\.|，|,|-|、|：|:|\/|[0-9])*(?=")/g)
            if(!match6) match6 = [];
            // 
            var match7 = contents.match(/\('([\u4e00-\u9fa5]+(\S*))'\)/g)
            if(!match7) match7 = [];
            // 
            translateTexts = translateTexts.concat( match1.concat( match2.concat(  match3.concat( match4.concat( match5.concat( match6.concat( match7 ) ) ) ) ) ) )
        });
    }
    // 
    var langs = [];
    if(translateModel == 2){
        langs = getWebLanguage(targetPath).map(h=>{ return (h.CN || h.cn || h.zh || h.ZH)  });
    }else{
        var language = getWebLanguage( targetPath + '/' + chinese );
        for (var x in language){
            langs.push(x);
        }
    }
    translateTexts = translateTexts.map(h=>{ 
        return h.replace("('", '').replace("')", '').replace(/^'/, '').replace(/^"/, '')
    })
    translateTexts = translateTexts.filter(h=>{
        if( langs.indexOf(h) == -1 && h.indexOf('}') == -1 && h.indexOf('<') == -1 && h.indexOf('}}') == -1 && h.indexOf("')") == -1 ){
            return true;
        }
        return false;
    })
    // 
    translateTexts = [...new Set(translateTexts)];
    // 
    return translateTexts;
}

/**
 * 文件遍历方法
 * @param dir 需要遍历的文件路径
 */  
function readFileList(dir, filesList = [],$is=true) {
    const files = fs.readdirSync(dir);
    files.forEach((item, index) => {
        var fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        // 排除目录 - 
        if( dir.indexOf('node_modules') !=-1 || dir.indexOf('storage') !=-1 || dir.indexOf('vendor') !=-1){
            return;  
        }
        // 排除目录
        if($is){
            var isExclude = false;
            excludes.forEach(function(name){  if( dir.indexOf(name) !=-1 ){  isExclude = true;  } })
            if(isExclude)  return;  
        }
        // 
        if (stat.isDirectory()) {      
            readFileList(path.join(dir, item), filesList, $is);  //递归读取文件
        } else {     
            if($is){
                //  允许文件
                var isFileSuffix = false;
                fileSuffix.forEach(function(name){ if( fullPath.indexOf(name) !==-1 ){ isFileSuffix = true; }   })
                if(!isFileSuffix)  return;
            }
            // 
            filesList.push(fullPath);                     
        }        
    });
    return filesList;
}


// 有道翻译
function youDaoTranslate(query,to='en'){
    to = to.toLowerCase();
    if(to == 'ZH') to = 'zh-CHS';
    if(to == 'zh') return query;
    if(to == 'zh-tw') to = 'zh-CHT';
    function truncate(q){
        var len = q.length;
        if(len<=20) return q;
        return q.substring(0, 10) + len + q.substring(len-10, len);
    }
    var salt = (new Date).getTime();
    var curtime = Math.round(new Date().getTime()/1000);
    var from = 'zh';
    var str1 = appKey + truncate(query) + salt + curtime + secretKey;
    var sign = crypto.createHash('sha256').update(str1).digest('hex');
    var urlParams = {
        q: query,
        appKey: appKey,
        salt: salt,
        from: from,
        to: to,
        sign: sign,
        signType: "v3",
        curtime: curtime
    };
    var queryString = new URLSearchParams(Object.entries(urlParams)).toString();
    var res = request('GET',' https://openapi.youdao.com/api?'+queryString)
    if (res && res.statusCode == 200) {
        var body = res.getBody();
        var jsonObj = JSON.parse(body); // 解析接口返回的JSON内容
        if (jsonObj.errorCode == '0' && jsonObj.translation && jsonObj.translation[0]  ){
            return jsonObj.translation[0];
        }else{
            log('');
            console.error('\033[41;31m有道翻译错误，请求失败：密钥错误\033[0m'); 
            process.exit()
            return '';
        }
    }else{
        log('');
        console.error('\033[41;31m有道翻译错误，请求失败：\033[0m',res);
        process.exit()
        return '';
    }
}

// 谷歌翻译
function googleTranslate(text,tl='en'){
    var urlParams = {
        'client'   : 'gtx',
        'hl'       : 'zh',      //
        'dt'       : 't',       // Translate,
        'sl'       : 'auto',    // Source language
        'tl'       : tl,        // Target language
        'q'        : text,      // String to translate
        'ie'       : 'UTF-8',   // Input encoding
        'oe'       : 'UTF-8',   // Output encoding
        'multires' : 1,
        'otf'      : 0,
        'pc'       : 1,
        'trs'      : 1,
        'ssel'     : 0,
        'tsel'     : 0,
        'kc'       : 1,
        'tk'       : '736127.854017',
    };
    var queryString = new URLSearchParams(Object.entries(urlParams)).toString();
    var res = request('GET','https://translate.google.com/translate_a/single?'+queryString)
    if(tl.toLowerCase() == 'zh') return text;
    if (res && res.statusCode == 200) {
        var body = res.getBody();
        var jsonObj = JSON.parse(body); // 解析接口返回的JSON内容
        if (jsonObj && jsonObj[0] && jsonObj[0][0] && jsonObj[0][0][0]) {
            return jsonObj[0][0][0];
        }else{
            log('');
            console.error('\033[41;31m谷歌翻译错误，请求失败:\033[0m',jsonObj);
            process.exit()
            return '';
        }
    }else{
        log('');
        console.error('\033[41;31m谷歌翻译错误，请求失败: 请留意网络是否可以正常访问google \033[0m');
        process.exit()
        return '';
    }
}

// 翻译
function sleep (time) {
    return new Promise((resolve) => setTimeout(resolve, time));
}
function translate(text,languageList,channel){
    var index = 0;
    if(languageList.length > 0 && channel === 'google'){
        sleep(10000).then(() => {
            if(index==0){
                console.log('\033[41;31m谷歌翻译错误，请求失败: 请留意网络是否可以正常访问google \033[0m');
                process.exit()
            }
        })
    }
    var texts = languageList.map(lang => {
        var slang = lang;
        if(lang=='TC' || lang=='tc' || lang=='Tc' || lang=='tC'){
            slang = 'ZH-TW'
        }
        if(lang=='cn' || lang=='Cn' || lang=='CN' || lang=='cN'){
            slang = 'ZH'
        }
        var value = channel == 'youdao' ? youDaoTranslate(text,slang) :  googleTranslate(text,slang);
        if(value){
            index = index + 1;
        }
        return {
            key : lang,
            value : value
        };
    });
    // 处理格式
    var result = {};
    if(translateModel=='2'){
        texts.forEach(o => { result[o.key]  = o.value; });
    }else{
        result = texts
    }
    return result;
}
  

