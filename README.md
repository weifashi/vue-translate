# vue-auto-translate

#### 介绍
##### 全自动化翻译插件，自动检测项目所有中文字体执行翻译，可指定翻译语言（多选），可指定翻译目录与输出目录 ，可选择谷歌或有道翻译

##### 1.下载
```
npm install vue-auto-translation
```

##### 2.安装完成后会在根目录生成配置文件 translate.json
```
{
    "translateModel": 1,
    "filePath": "./",
    "targetPath": "",           //指定翻译成功后输出的目录,为空时将自动查询，示列："src/i18n"
    "languageList": [           //指定需要翻译的语言列表
        "CN",
        "EN",
        "TC"
    ],
    "channel": "google",
    "appKey": "",
    "secretKey": "",
    "excludes": [
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
        "lang"
    ],
    "fileSuffix": [
        ".vue",
        ".html",
        ".js",
        ".ts",
        ".php"
    ]
}
```

{**以下是 Gitee 平台说明，您可以替换此简介**
Gitee 是 OSCHINA 推出的基于 Git 的代码托管平台（同时支持 SVN）。专为开发者提供稳定、高效、安全的云端软件开发协作平台
无论是个人、团队、或是企业，都能够用 Gitee 实现代码托管、项目管理、协作开发。企业项目请看 [https://gitee.com/enterprises](https://gitee.com/enterprises)}

#### 软件架构
软件架构说明


#### 安装教程

1.  xxxx
2.  xxxx
3.  xxxx

#### 使用说明

1.  xxxx
2.  xxxx
3.  xxxx

#### 参与贡献

1.  Fork 本仓库
2.  新建 Feat_xxx 分支
3.  提交代码
4.  新建 Pull Request


#### 特技

1.  使用 Readme\_XXX.md 来支持不同的语言，例如 Readme\_en.md, Readme\_zh.md
2.  Gitee 官方博客 [blog.gitee.com](https://blog.gitee.com)
3.  你可以 [https://gitee.com/explore](https://gitee.com/explore) 这个地址来了解 Gitee 上的优秀开源项目
4.  [GVP](https://gitee.com/gvp) 全称是 Gitee 最有价值开源项目，是综合评定出的优秀开源项目
5.  Gitee 官方提供的使用手册 [https://gitee.com/help](https://gitee.com/help)
6.  Gitee 封面人物是一档用来展示 Gitee 会员风采的栏目 [https://gitee.com/gitee-stars/](https://gitee.com/gitee-stars/)
