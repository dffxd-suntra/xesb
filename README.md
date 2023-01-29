# 寒假过去这么多天,该给一个交代了
<img src="https://raw.githubusercontent.com/dffxd-suntra/xesb/main/example/short11.gif" />
动图展示了画廊和图片的自动加载功能,其中展示的所有页面皆为离线,且没有联网确认的功能(除了解析画廊下载图片,就没有联网),以后有时间会推出标签过滤,类型过滤,标题搜索,排序,收藏,阅读历史等多种功能,主要是现在前端不会做,后端几千行就功能全出来了  
下载功能做的不好,没有脸拿出来,主要是不知道哪里的错误回调没有处理好,会丢页数,其次是不知道怎么展示详细信息,其他功能我都做好了,比如下载完整图片,范围下载(原生支持),下载进程解析进程,重试次数,自动使用备用线路,就是点击`Click here if the image fails loading`后跳转到的页面,所有的都支持,主要是现在前端不会做,后端一行不要就有这些功能  
第二,画廊也是,所有明面上展示给你的信息我都收集了,就是不知道怎么展示给你们  

# xesb

本脚本兼容内,外站,只兼容浏览页面,画廊页面和画廊中的图片浏览页面  

2023.1.12 正在做chrome扩展程序,这样子我就可以实现更多的功能,更优秀的使用体验,以及更加随性所欲的写我想写的代码(跨域和其他限制把我折腾坏了

正在看ECMAscript文档...难蚌

我一整天都在看chrome扩展插件的文档，总结出了几个对本插件有利的功能，但是担心是否值得做，因为用户脚本对于普通用户实在是太香了，完全没有任何门槛，手机，各种浏览器都可以用，浏览器插件比起来安装就麻烦的多
## 浏览器插件优势：
1. 可以后台下载（利用jsdom+browserify实现）
2. 可以按照文件目录的方式存储，不用非得打成zip，无形之中突破了blob的存储限制（有的画廊6个g）
3. 有更好看的界面以及更方便的操作：利用我以前的项目完全可以做到离线预览下载中或下载完的漫画，不用非得上网站上看

对于第三点，我有更庞大的想法
<details>
    <summary>点击查看想法</summary>
    <h1>我可以让插件变成浏览器应用（pwm）并利用扩展插件丰富的功能做到以下这样子的页面，而且是完全的js（展示的图片是我架在家里的nas+一点点php的结果）其实普通的js页面也可以做到，只不过产生不了用户粘性，而且有限制，我就懒得做了，现在又有这个机会了，又有了新的动力，只要让我看见多一个star（当前2），我这个寒假死活都会给你们做出来</h1>
    <h2>主页图片</h2>
    <img src="https://user-images.githubusercontent.com/47025714/212099981-4ce25ba5-9fbb-440d-ae3e-34bf1ac408a6.png"/>
    <h2>预览界面图片</h2>
    <img src="https://user-images.githubusercontent.com/47025714/212103524-a38ff790-88ad-4da2-abd2-94b8b9a9a5ca.png"/>
</details>


## 脚本优势：
1. 方便
2. 很方便
3. 非常方便
4. 超级方便
5. 无敌方便
