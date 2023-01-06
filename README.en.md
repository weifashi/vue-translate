# vue-auto-translate

##### introduce
##### Fully automated translation plug-in, automatically detect all the Chinese fonts of the project to perform translation, can specify translation language (multiple options), can specify translation directory and output directory, can choose Google or Youdao Translation

##### 1.install
```
npm install vue-auto-translate
```

##### 2.After the installation is complete, the configuration file is generated in the root directory translate.json
```
{
    "translateModel": 1,    // Translation mode: 1 (i18n), 2 (Dolphin format)
    "strict": false,        // Strict mode or not. The default value is false to extract global Chinese. If true, only Chinese in $t("). $L(") will be extracted
    "filePath": "./",       // Specifies the directory where you want to query translations
    "targetPath": "",       // Specify the output directory after successful translation, empty will be automatically queried, listed："/src/i18n" ，'/resources/assets/js/language/language.js‘
    "languageList": [       // Specifies a list of languages to be translated
        "CN",
        "EN",
        "TC"
    ],
    "channel": "google",    // Translation channel: youdao, google
    "appKey": "",           // Translation channel application key, google does not need
    "secretKey": "",        // Translation channel application key, google does not need
    "excludes": [           // Exclude directories that do not require translation
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
    "fileSuffix": [        // Specifies which suffix files to translate only
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
npm run translation              //All Chinese characters in the configuration directory are automatically extracted for translation

npm run translation  -- '你好'    //Only a single input text is translated
```

