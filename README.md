# vue-auto-translate

##### 介绍
##### 全自动化翻译插件，自动检测项目所有中文字体执行翻译，可指定翻译语言（多选），可指定翻译目录与输出目录 ，可选择谷歌或有道翻译

##### 1.安装
```
npm install vue-auto-translate
```

##### 2.安装完成后会在根目录生成配置文件 translate.json
```
{
    "translateModel": 1,    // 翻译模式：1 (i18n)，2 (海豚格式)
    "strict": false,        // 是否严格模式，默认为false提取全局中文，为true时将只提取 $t(''). $L('') 内的中文
    "filePath": "./",       // 指定需要查询翻译的目录
    "targetPath": "",       // 指定翻译成功后输出的目录,为空时将自动查询，示列："/src/i18n" ，'/resources/assets/js/language/language.js‘
    "languageList": [       // 指定需要翻译的语言列表
        "CN",
        "EN",
        "TC"
    ],
    "channel": "google",    // 翻译渠道： youdao 有道, google 谷歌
    "appKey": "",           // 翻译渠道的应用key，google不需要
    "secretKey": "",        // 翻译渠道的应用密钥，google不需要
    "excludes": [           // 排除不需要翻译的目录
        "node_modules",
        "vendor",
        "build",
        "dist",
        ".git",
        ".vscode",
        "storage",
        "public",
        "language",
        "database",
        "lang",
        "i18n",
        ".svn"
    ],
    "fileSuffix": [        // 指定只翻译哪些后缀文件
        ".vue",
        ".html",
        ".js",
        ".ts",
        ".php"
    ]
}
```

##### 3.执行翻译
```
npm run translate              //自动提取配置目录下所有中文进行翻译

npm run translate  -- '你好'    //只翻译单个输入文本
```

