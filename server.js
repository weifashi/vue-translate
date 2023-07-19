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
var channel = config.channel || 'google';           // 翻译渠道： baidu 百度, youdao 有道, google 谷歌
var strict = config.strict || false;                // 是否严格模式，默认为false提取全局中文，为true时将只提取 $t(''). $L('') 内的中文
// var changeKey = config.changeKey || false;      // 是否更换key，默认为false以中文作为key，为true时将以拼音代替并替换选中文本,strict等于true与translateModel=1时生效
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
        console.error('[41;31m请配置appKey[0m');
        return false;
    }
    if(!secretKey){
        console.error('[41;31m请配置secretKey[0m');
        return false;
    }
}
if(!languageList[0]){
    console.error('[41;31m请配置languageList[0m');
    return false;
}

// 判断 targetPath
if(!targetPath){
    readFileList(filePath,[],false).forEach(file=>{ 
        if(!targetPath && translateModel == 1 && file.indexOf('/i18n') !== -1 ){
            var files = file.split('/');
            targetPath = file.replace('/'+ files[ files.length - 1 ], '') 
        }
        if(!targetPath && (translateModel == 2 || translateModel == 3) && file.indexOf('language.js') !== -1){
            targetPath = file;
        }
    });
    // 
    if(!targetPath){
        console.error('[41;31m请配置targetPath[0m');
        return false;
    }
}else{
    var stat = '';
    try {
        stat = fs.statSync(targetPath); 
    } catch (error) {}
    if(!stat){
        console.error('[41;31m targetPath 错误，找不到 [0m');
        return false;
    }
    if((translateModel == 2 || translateModel == 3) && stat.isDirectory() ){
        console.error('[41;31m targetPath 错误，必须是文件 [0m');
        return false;
    }
    if(translateModel == 1 && !stat.isDirectory() ){
        console.error('[41;31m targetPath 错误，必须是目录 [0m');
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
    if(translateModel==1){
        resultTexts.forEach(resultText=>{ 
            var key  = '';
            resultText.forEach(h=>{ 
                if(h.key=='CN' || h.key == 'cn' ||  h.key == 'zh' ||  h.key == 'ZH'){
                    key = h.value;
                }
            })
            // if(changeKey && strict){
            //     key = pinyin.pinyin(key,{toneType:'none',nonZh:'consecutive'}).replace(/ /g,'-')
            // }
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
    }else{
        resultTexts = getWebLanguage(targetPath).concat(resultTexts);
        resultTexts = JSON.stringify(resultTexts);
        resultTexts = resultTexts.replace("[{", "[\n   {");
        resultTexts = resultTexts.replace(/},{/g, "},\n   {");
        resultTexts = resultTextsS = resultTexts.replace("}]", "}\n]");
        resultTexts = ((fs.readFileSync(targetPath)+'').indexOf('exports.default=') == -1 ? "export default " : "exports.default=") + resultTexts;
        fs.writeFile(targetPath,resultTexts,function(err,result) {});
        if( translateModel == 3 ){
            const languageArr = JSON.parse(resultTextsS)
            const LANGUAGE_DATA = {}
            // 循环组合数据
            languageArr.map((item, index) => {
                if (!LANGUAGE_DATA['key']) LANGUAGE_DATA['key'] = {}
                LANGUAGE_DATA['key'][item.CN] = index
                for (const key in item) {
                    if (Object.hasOwnProperty.call(item, key)) {
                        if (!LANGUAGE_DATA[key]) LANGUAGE_DATA[key] = []
                        LANGUAGE_DATA[key].push(key != 'CN' ? item[key] : '')
                    }
                }
            })
            // 写入文件
            for (const key in LANGUAGE_DATA) {
                if (Object.hasOwnProperty.call(LANGUAGE_DATA, key)) {
                    const data = LANGUAGE_DATA[key]
                    mkdirFile(key, data)
                }
            }
        }
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
            if(!strict){
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
                var match7 = contents.match(/(\('|\(")[\u4e00-\u9fa5](\S*)('\)|"\))/g)
                if(!match7) match7 = [];
                // // 
                var match8 = contents.match(/(\('|\(")[1-9](\.|，|,|-|、|：|:|\/)[\u4e00-\u9fa5](\S*)('\)|"\))/g)
                if(!match8) match8 = [];
                // 
                translateTexts = translateTexts.concat( match1.concat( match2.concat(  match3.concat( match4.concat( match5.concat( match6 ) ) ) ) ) )
                translateTexts = translateTexts.concat( match7.concat( match8 ) )
            }else{
                var array = [];
                var match = contents.match(/(\$t\(|\$L\()(['"])(.*?)\2\)/g)
                if(match){
                    (match || []).forEach(str=>{
                        if(/[\u4e00-\u9fa5]/.test(str) && (str.match(/\+/g) || []).length < 2 && str.indexOf('this.$L') == -1 && str.indexOf('this.$t') == -1){
                            array.push(str);
                        }
                    })
                }
                translateTexts = translateTexts.concat(array)
            }
        });
    }
    // 
    var langs = [];
    if(translateModel == 2 || translateModel == 3){
        langs = getWebLanguage(targetPath).map(h=>{ return (h.CN || h.cn || h.zh || h.ZH)  });
    }else{
        var language = getWebLanguage( targetPath + '/' + chinese );
        for (var x in language){
            langs.push(language[x]);
        }
    }
    if(texts.length == 0){
        translateTexts = translateTexts.map(h=>{ 
            return h
            .replace("$t('", '').replace('$t("', '')
            .replace("$L('", '').replace('$L("', '')
            .replace("('", '').replace("')", '')
            .replace('("', '').replace('")', '')
            .replace(/^'/, '').replace(/^"/, '')
        })
    }
    translateTexts = translateTexts.filter(h=>{
        if( langs.indexOf(h) == -1){
            if( texts.length > 0 || (h.indexOf('}') == -1 && h.indexOf('<') == -1 && h.indexOf('}}') == -1 && h.indexOf("')") == -1 && h.indexOf('")') == -1)){
                return true;
            }
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

// 百度翻译
function baiduTranslate(query,to='en'){
    to = to.toLowerCase();
    if(to == 'zh') return query;
    if(to == 'zh-tw') to = 'cht';
    if(to == 'km') to = 'tr';   //土耳其
    if(to == 'th') to = 'th';   //泰语
    if(to == 'ko') to = 'kor';  //韩语
    if(to == 'ja') to = 'jp';   //日语
    function truncate(q){
        var len = q.length;
        if(len<=20) return q;
        return q.substring(0, 10) + len + q.substring(len-10, len);
    }
    var salt = (new Date).getTime();
    var str1 = appKey + truncate(query) + salt + secretKey;
    var sign = crypto.createHash('md5').update(str1).digest('hex');
    var urlParams = {
        q: query,
        appid: appKey,
        salt: salt,
        from: 'zh',
        to: to,
        sign: sign
    };
    var queryString = new URLSearchParams(Object.entries(urlParams)).toString();
    var res = request('GET','https://fanyi-api.baidu.com/api/trans/vip/translate?'+queryString)
    if (res && res.statusCode == 200) {
        var body = res.getBody();
        var jsonObj = JSON.parse(body); // 解析接口返回的JSON内容
        if (!jsonObj.error_code && jsonObj.trans_result && jsonObj.trans_result[0]  ){
            return jsonObj.trans_result[0]['dst'];
        }else{
            log('');
            console.error('[41;31m百度翻译错误，请求失败：[0m',jsonObj); 
            process.exit()
        }
    }else{
        log('');
        console.error('[41;31m百度翻译错误，请求失败：[0m',res);
        process.exit()
    }
}

// 有道翻译
function youDaoTranslate(query,to='en'){
    to = to.toLowerCase();
    if(to == 'zh') return query;
    if(to == 'zh-tw') to = 'zh-CHT';
    function truncate(q){
        var len = q.length;
        if(len<=20) return q;
        return q.substring(0, 10) + len + q.substring(len-10, len);
    }
    var salt = (new Date).getTime();
    var curtime = Math.round(new Date().getTime()/1000);
    var str1 = appKey + truncate(query) + salt + curtime + secretKey;
    var sign = crypto.createHash('sha256').update(str1).digest('hex');
    var urlParams = {
        q: query,
        appKey: appKey,
        salt: salt,
        from: 'zh',
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
            console.error('[41;31m有道翻译错误，请求失败：密钥错误[0m'); 
            process.exit()
        }
    }else{
        log('');
        console.error('[41;31m有道翻译错误，请求失败：[0m',res);
        process.exit()
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
            return jsonObj[0].map(h=>{ return h[0] }).filter((value, index, self) => {
                return self.indexOf(value) === index;
            }).join('');
        }else{
            log('');
            console.error('[41;31m谷歌翻译错误，请求失败:[0m',jsonObj);
            process.exit()
        }
    }else{
        log('');
        console.error('[41;31m谷歌翻译错误，请求失败: 请留意网络是否可以正常访问google [0m');
        process.exit()
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
                console.log('[41;31m谷歌翻译错误，请求失败: 请留意网络是否可以正常访问google [0m');
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
        var value = channel == 'youdao' ? youDaoTranslate(text,slang) : (channel == 'baidu' ? baiduTranslate(text,slang) : googleTranslate(text,slang));
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
    if(translateModel=='1'){
        result = texts
    }else{
        texts.forEach(o => { result[o.key]  = o.value; });
    }
    return result;
}

// 创建文件
function mkdirFile(lang, data) {
    lang = lang.toLowerCase()
    const basePath = targetPath.replace("/"+ targetPath.split("/")[targetPath.split("/").length-1] ,"")
    fs.mkdir(`${basePath}/locales`,function(err){
        fs.writeFile(`${basePath}/locales/${lang}.js`,`if(typeof window.LANGUAGE_DATA==="undefined")window.LANGUAGE_DATA={};window.LANGUAGE_DATA["${lang}"]=` + JSON.stringify(data), (err) => {
            if (err) {
                console.log('写入文件失败！')
            } else {
                console.log('写入文件成功！' + `${basePath}/locales/${lang}.js`)
            }
        })
    })
    
}