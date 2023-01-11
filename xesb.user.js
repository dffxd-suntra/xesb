// ==UserScript==
// @name         xesb 2.5.0
// @author       Suntra
// @version      2.5.0
// @namespace    https://github.com/dffxd-suntra/xesb
// @description  exhentai/e-hentai 油猴插件,可以批量爬取图片,并且开发了预览功能
// @homepage     https://github.com/dffxd-suntra/xesb
// @match        *://exhentai.org/*
// @match        *://e-hentai.org/*
// @match        *://exhentai55ld2wyap5juskbm67czulomrouspdacjamjeloj7ugjbsad.onion/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.3/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js
// @require      https://cdn.jsdelivr.net/npm/moment@2.29.4/moment.min.js
// @require      https://cdn.jsdelivr.net/npm/moment@2.29.4/locale/zh-cn.js
// @require      https://cdn.jsdelivr.net/npm/jszip@3.7.1/dist/jszip.min.js
// @require      https://cdn.jsdelivr.net/npm/file-saver@2.0.5/dist/FileSaver.min.js
// @require      https://cdn.jsdelivr.net/npm/uuidjs@4.2.12/src/uuid.min.js
// @require      https://cdn.jsdelivr.net/npm/localforage@1.10.0/dist/localforage.min.js
// @grant        unsafeWindow
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @grant        GM_registerMenuCommand
// @grant        GM_info
// @grant        GM_addStyle
// @grant        GM_listValues
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
// @grant        GM_setValue
// @grant        GM_getValue
// @antifeature  R18!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
// @connect      e-hentai.org
// @connect      exhentai.org
// @connect      ehgt.org
// @connect      exhentai55ld2wyap5juskbm67czulomrouspdacjamjeloj7ugjbsad.onion
// @connect      hath.network
// @license      GNU GPLv3
// ==/UserScript==

// 还没有使用fetch,因为不是很熟悉,一顺手就写成jquery了(看文档确实fetch好用啦
// 使用刚学的伪类
let XESB = {};
XESB.config = {
    baseName: "sexb"
};
if(localforage.supports(localforage.INDEXEDDB)) {
    localforage.setDriver(localforage.INDEXEDDB);
    XESB.config.supportsCache = true;
} else {
    XESB.config.supportsCache = false;
}



XESB.api = (function () {
    return function (userConfig = {}) {
        // 类
        // html解析类
        class ParseHtml {
            // 去除script标签(可选
            strRemoveScript(str) {
                return str.replace(/(<script(.*?)>)(.|\n)*?(<\/script>)/g, "");
            }
            //字符串转化为xml
            toDocuemnt(source) {
                return new DOMParser().parseFromString(source, "text/html");
            }
            // jquery自带的就是依托答辩
            getDocument(url, script=true) {
                let that = this;
                return new Promise(function (resolve, reject) {
                    $.get({
                        url: url,
                        dataType : "text",
                        success: function (result, status, xhr) {
                            if (!script) {
                                result = that.toDocuemnt(that.strRemoveScript(result));
                            }
                            resolve(that.toDocuemnt(result));
                        },
                        error: function (xhr, status, error) {
                            reject({
                                xhr: xhr,
                                status: status,
                                error: error
                            });
                        }
                    });
                });
            }
        }
        this.ParseHtml = ParseHtml;

        // 页面解析类,继承ParseHtml
        class ParsePage extends ParseHtml {
            constructor(url) {
                super();
                // 初始化链接
                this.url = new URL(url);

                // 页面的种类
                this.pageType = getPageType(this.url.pathname);

                // 判断合法性
                if (this.pageType==-1||14<this.pageType) {
                    throw new Error(`您的地址不对劲: "${url}"`);
                    return;
                }

                // 一些网页的节点
                this.nodes = {};

                // 画廊的详细信息
                this.galleryInfo = [];

                // 正整数或NaN
                this.next = parseInt(this.url.searchParams.get("next"));

                // 浏览模式的标签
                this.modeLabel = {"m": "Minimal", "p": "Minimal+", "l": "Compact", "e": "Extended", "t": "Thumbnail"};
            }
            // 初始化选择器的字符串
            selectorInit() {
                // 每一个页面都有的翻页
                this.selector = {
                    ufirst: "#ufirst",
                    uprev: "#uprev",
                    ujumpBox: "#ujumpbox",
                    ujump: "#ujump",
                    unext: "#unext",
                    ulast: "#ulast",
                    dfirst: "#dfirst",
                    dprev: "#dprev",
                    djumpBox: "#djumpbox",
                    djump: "#djump",
                    dnext: "#dnext",
                    dlast: "#dlast"
                };

                // 普通页面
                if (0<=this.pageType&&this.pageType<=12) {
                    this.selector.searchbox = "#searchbox";
                    this.selector.rangebar = "#rangebar";
                    this.selector.mode = ".searchnav > div > select";
                    this.selector.container = "body > div.ido > div";
                }

                // 流行页面
                if (this.pageType==13) {
                    this.selector.mode = ".searchnav > div > select";
                    this.selector.container = "body > div.ido > div";
                }

                // 特殊的收藏页面
                if (this.pageType==14) {
                    this.selector.order = ".searchnav > div > select:contains('Published Time')";
                    this.selector.mode = ".searchnav > div > select:contains('Minimal')";
                    this.selector.container = "#favform";
                }

                // 获取浏览模式
                this.mode = this.modeLabel[$(this.selector.mode, this.pageDocuemnt).val()];
                // 前四种本质上就是html table,解析出来会被自动添加tbody
                if (this.mode == "Minimal"||this.mode == "Minimal+") {
                    this.selector.infoContainer = this.selector.container+" > table.itg.gltm";
                    this.selector.infos = this.selector.infoContainer+" > tbody > tr";
                }
                if (this.mode == "Compact") {
                    this.selector.infoContainer = this.selector.container+" > table.itg.gltc";
                    this.selector.infos = this.selector.infoContainer+" > tbody > tr";
                }
                if (this.mode == "Extended") {
                    this.selector.infoContainer = this.selector.container+" > table.itg.glte";
                    this.selector.infos = this.selector.infoContainer+" > tbody > tr";
                }
                // 后一种就是真的排出来的
                if (this.mode == "Thumbnail") {
                    this.selector.infoContainer = this.selector.container+" > div.itg.gld";
                    this.selector.infos = this.selector.infoContainer+" > div";
                }
            }
            // 解析页面节点
            parseNodes() {
                // 简单粗暴
                for (let i in this.selector) {
                    this.nodes[i] = $(this.selector[i], this.pageDocuemnt);
                }
            }
            // 解析页面信息,根据页面节点
            parseInfos() {
                // 获取为数组形式
                let infos = this.nodes.infos.get();
                // 一个一个获取
                for (let i in infos) {
                    this.galleryInfo[i] = {};

                    // 名称
                    this.galleryInfo[i].name = $(infos[i]).find(".glink").text();

                    // 链接
                    this.galleryInfo[i].url = $(infos[i]).find(".glink").parent("a[href]").attr("href");

                    // 种类
                    this.galleryInfo[i].type = $(infos[i]).find(".cs").text();

                    // 封面链接
                    this.galleryInfo[i].cover = $(infos[i]).find(`img[alt="${this.galleryInfo[i].name}"]`).attr("src");

                    // 页数
                    this.galleryInfo[i].pages = parseInt($($(infos[i]).find(":contains('pages')").get().find(node => /^\d+(?= pages$)/g.test($(node).text())&&!$(node).hasClass("glink")&&$(node).find(".glink").length==0)).text());

                    // 是否有种子
                    this.galleryInfo[i].hasTorrents = $(infos[i]).find(".gldown > img").children("a").length!=0;

                    // token和gid
                    let temp = infoUrlToTokenAndGid(this.galleryInfo[i].url);
                    this.galleryInfo[i].gid = temp.gid;
                    this.galleryInfo[i].token = temp.token;

                    // 上传时间的时间戳
                    this.galleryInfo[i].postTime = moment($(infos[i]).find("#posted_"+this.galleryInfo[i].gid).text()).valueOf();

                    // 收藏夹名称,不在则是空字符串
                    this.galleryInfo[i].favorite = $(infos[i]).find("#posted_"+this.galleryInfo[i].gid).attr("title") || "";

                    // 大概的分数 总量5 分度值0.5
                    // https://ehgt.org/img/rt.png
                    // 标签的星星为正方形,边长16,第一行离图片上边框1px,两行间隔4px,最后一行离图片下边框1px,星星之间无距离,第一个星星离图片左边框无距离,第一行最后一个星星离右边框无距离,第二行比第一行少一个星星
                    // 计算星星公式: score = 5-x/16-(y==-21?0.5:0); x. y分别对应css的背景定位中的x和y,别忘了字符串转int
                    this.galleryInfo[i].fuzzyRating = $(infos[i]).find("div.ir").get(0);
                    this.galleryInfo[i].fuzzyRating = 5 - Math.abs(parseInt(this.galleryInfo[i].fuzzyRating.style.backgroundPositionX))/16 - (parseInt(this.galleryInfo[i].fuzzyRating.style.backgroundPositionY)==-21?0.5:0);
                }

                // 第一页 最后一页 下一页 上一页 的链接
                this.firstPageUrl = this.nodes.ufirst.attr("href") || this.url.toString();
                this.lastPageUrl = this.nodes.ulast.attr("href") || this.url.toString();
                this.prevPageUrl = this.nodes.uprev.attr("href");
                this.nextPageUrl = this.nodes.unext.attr("href");
            }
            parse() {
                // 解析节点
                this.parseNodes();

                // 解析信息
                this.parseInfos();
            }
            async init() {
                // 获取文档
                this.pageDocuemnt = await this.getDocument(this.url.toString());

                // 获取解析器字符串
                this.selectorInit();

                // 解析页面
                this.parse();

                return this;
            }
        }
        this.ParsePage = ParsePage;

        // 图片页面解析类,继承ParseHtml,因为页面简单,所以就简化了一些步骤
        class ParseImgPage extends ParseHtml {
            constructor(url) {
                super();
                // 初始化链接
                this.url = new URL(url);

                // 页面的种类
                this.pageType = getPageType(this.url.pathname);

                // 判断合法性
                if (this.pageType!=16) {
                    throw new Error(`您的地址不对劲: "${url}"`);
                    return;
                }

                // 图片信息
                this.pic = {};
            }
            // 解析页面和图片信息
            parse() {
                // 图片节点
                let pic = $("#img", this.pageDocuemnt).get(0);

                let picInfo = this.pic;

                // 图片链接
                picInfo.url = $(pic).attr("src");

                // 图片名称
                picInfo.name = new URL(picInfo.url).pathname.split("/").pop();
                if(picInfo.name=="509.gif") {
                    this.pic = {};
                    return false;
                }

                // 图片宽度
                picInfo.width = parseInt(pic.style.width);

                // 图片高度
                picInfo.height = parseInt(pic.style.height);

                // 原图链接
                picInfo.full = $("#i7 > a", this.pageDocuemnt).attr("href");

                // 图片索引值
                picInfo.fileIndex = parseInt(picInfo.url.match(/(?<=fileindex=).*(?=;xres=)/g)[0]);

                // 图片的一个奇奇怪怪的字符串,可以加载备用图片
                picInfo.nl = $("#loadfail", this.pageDocuemnt).prop("outerHTML").match(/(?<=nl\(').*(?='\))/g)[0];

                // 图片对应的画廊链接
                picInfo.galleryUrl = $("#i5 > div > a", this.pageDocuemnt).attr("href");
            }
            // 获取备用图片(从exhentai自己的图床里调,会消耗积分?
            async loadSpare() {
                // 获取备用图片的页面地址
                let url = new URL(this.url.origin+this.url.pathname);
                url.searchParams.set("nl", this.pic.nl);

                // 获取文档
                let pageDocuemnt = await this.getDocument(url.toString());

                // 获取图片
                let pic = $("#img", pageDocuemnt).get(0);

                let picInfo = {};

                // 图片链接
                picInfo.url = $(pic).attr("src");

                // 图片名称
                picInfo.name = new URL(picInfo.url).pathname.split("/").pop();

                // 图片宽度
                picInfo.width = parseInt(pic.style.width);

                // 图片高度
                picInfo.height = parseInt(pic.style.height);

                // 完整图片链接
                picInfo.full = this.pic.full;

                // 图片索引
                picInfo.fileIndex = this.pic.fileIndex;

                // 画廊地址
                picInfo.galleryUrl = this.pic.galleryUrl;

                return picInfo;
            }
            async init() {
                // 获取文档
                this.pageDocuemnt = await this.getDocument(this.url.origin+this.url.pathname);

                // 解析页面
                this.parse();

                return this;
            }
        }
        this.ParseImgPage = ParseImgPage;

        // 画廊解析类,继承ParseHtml
        class ParseGallery extends ParseHtml {
            constructor(url) {
                super();
                // 初始化链接
                this.url = new URL(url);

                // 页面的种类
                this.pageType = getPageType(this.url.pathname);

                // 判断合法性
                if (this.pageType!=15) {
                    throw new Error(`您的地址不对劲: "${url}"`);
                    return;
                }

                // 一些网页的节点
                this.nodes = {};

                // 图片页面的链接
                this.pageUrl = [];

                // 图片页面的信息
                this.pageInfo = [];

                // token和gid
                let temp = infoUrlToTokenAndGid(url);
                this.gid = temp.gid;
                this.token = temp.token;
            }
            // 初始化选择器的字符串
            selectorInit() {
                this.selector = {
                    // 没有head是因为head的东西太多了,会影响判断,而且大部分都有对应的id
                    body: "#gdt",
                    foot: "#cdiv",

                    firstName: "#gn",
                    secendName: "#gj",
                    cover: "#gd1 > div",
                    type: "#gdc > div",
                    auther: "#gdn > a",
                    infos: "#gdd > table",
                    rating: "#gdr > table",
                    addToFavorites: "#gdf",
                    tags: "#taglist > table",
                    headSidebar: "#gd5", // 太多了,自己找去吧

                    rows: "#gdo2", // 我从来没见过能调几行的时候,可能我等级太低了把
                    mode: "#gdo4",

                    comments: "#cdiv"
                };

                // 获取页面浏览模式
                this.mode = $(this.selector.mode, this.pageDocuemnt).find(".tha").text();
                // 根据浏览模式获取合适的解析器
                if(this.mode == "Normal") {
                    this.selector.preview = ".gdtl";
                } else {
                    this.selector.preview = ".gdtm";
                }
            }
            // 解析页面节点
            parseNodes() {
                // 简单粗暴*2
                for (let i in this.selector) {
                    this.nodes[i] = $(this.selector[i], this.pageDocuemnt);
                }
            }
            // 解析页面信息
            parseInfos() {
                // 先解析画廊图片旁边显示的详细信息
                let temp1 = {};
                $("tr", this.nodes.infos).each(function (index, node) {
                    temp1[$(node).find(".gdt1").text().split(":")[0]] = $(node).find(".gdt2");
                });

                // 主名称
                this.firstname = this.nodes.firstName.text();

                // 副名称
                this.secendName = this.nodes.secendName.text();

                // 封面地址
                this.cover = this.nodes.cover.get(0).style.background.match(/(?<=url\(").*(?="\))/g)[0];

                // 画廊种类(例如 Image Set
                this.type = this.nodes.type.text();

                // 作者名
                this.auther = this.nodes.auther.text();

                // 作者链接
                this.autherUrl = this.nodes.auther.attr("href");

                // 发送时间(时间戳
                this.postTime = moment(temp1.Posted.text()).valueOf();

                // 画廊继承的画廊(gid)(正整数或NaN
                this.parent = parseInt(temp1.Parent.text());

                // 画廊继承的画廊的链接
                this.parentUrl = temp1.Parent.children("a").attr("href");

                // 是否可见(bool
                this.visible = temp1.Visible.text()=="Yes";

                // 语言
                this.language = temp1.Language.text().split(" ")[0];

                // 是否是翻译过来的
                this.isTranslation = temp1.Language.children("span").length != 0;

                // 文件大小
                this.fileSize = temp1["File Size"].text();

                // 图片页数
                this.pages = parseInt(temp1.Length.text());

                // 放进收藏夹的人数
                this.favorited = parseInt(temp1.Favorited.text());

                // 每一页显示多少图片
                this.limit = this.nodes.body.children(this.selector.preview).length;

                // 种子的个数
                this.torrentNum = parseInt(this.nodes.headSidebar.find("a:contains('Torrent Download ')").text().match(/(?<=^Torrent Download \().*(?=\)$)/g)[0]);

                // 详细分数 总值5 分度值0.01
                this.rating = parseFloat(this.nodes.rating.find("#rating_label").text().split(" ")[1]);

                // 投票的人数
                this.ragingCount = parseInt(this.nodes.rating.find("#rating_count").text());

                let that = this;

                // 解析标签
                this.tags = {};
                $("tr", this.nodes.tags).each(function (index, node) {
                    let title = $(node).children("td.tc").text().split(":")[0];
                    that.tags[title] = [];
                    $(node).find("td > div").each(function (index, node) {
                        let type;
                        // 完整的边框
                        if ($(node).hasClass("gt")) {
                            type = 0;
                        }
                        // 长条边框
                        if ($(node).hasClass("gtl")) {
                            type = 1;
                        }
                        // 点边框
                        if ($(node).hasClass("gtw")) {
                            type = 2;
                        }
                        that.tags[title].push({
                            type: type,
                            name: $(node).text(),
                            url: $(node).find("a").attr("href")
                        });
                    });
                });

                // 解析评论
                this.comments = [];
                $(this.nodes.comments).children(".c1").each(function (index, node) {
                    let id = parseInt($(node).prev().attr("name").substring(1));
                    let sp = $(node).find(".c2 > .c3").text().split(" ");
                    let spt = sp[5].split(":");
                    let timestamp = moment()
                    .year(parseInt(sp[4]))
                    .month(sp[3])
                    .date(parseInt(sp[2]))
                    .hour(parseInt(spt[0]))
                    .minute(parseInt(spt[1]));
                    let score = null;
                    let type;
                    if (id==0) {
                        type = 0;
                    } else {
                        type = 1;
                        score = parseInt($(node).find("#comment_score_"+id).text());
                    }
                    that.comments.push({
                        id: id,
                        uploder: {
                            name: $(node).find(".c2 > .c3 > a").text(),
                            url: $(node).find(".c2 > .c3 > a").attr("href")
                        },
                        content: $(node).find(".c6").text(),
                        score: score,
                        type: type,
                        timestamp: timestamp.valueOf()
                    });
                });
            }
            parse() {
                // 解析节点
                this.parseNodes();

                // 解析信息
                this.parseInfos();
            }
            async init() {
                // 获取文档
                this.pageDocuemnt = await this.getDocument(this.url.origin+this.url.pathname+"?hc=1");

                // 获取解析器字符串
                this.selectorInit();

                // 解析页面
                this.parse();

                return this;
            }
            // 获取图片页面信息
            async get(page, cache=true) {
                // 检测范围
                if(page<1||this.pages<page) {
                    throw new Error(`输入的正确的范围1-${this.pages}`);
                }

                let pageInfo = this.pageInfo;
                let pageUrl = this.pageUrl;

                // 获取某一张图片所在页面对应的url
                if(pageUrl[page-1] == undefined) {
                    let pager = Math.floor((page-1)/this.limit);
                    let pageDocuemnt = await this.getDocument(this.url.origin+this.url.pathname+"?p="+pager);
                    let start = this.limit*pager;
                    $(this.selector.body+" > "+this.selector.preview, pageDocuemnt).each(function (index, node) {
                        pageUrl[start+index] = $(node).find("a").attr("href");
                    });
                }

                // 获取图片信息(如果没有存起来的话
                if(pageInfo[page-1] == undefined&&cache) {
                    pageInfo[page-1] = new ParseImgPage(pageUrl[page-1]);
                    await pageInfo[page-1].init();
                }
                return pageInfo[page-1];
            }
        }
        this.ParseGallery = ParseGallery;



        // 函数
        // 根据画廊链接获取token和gid
        function infoUrlToTokenAndGid(url) {
            let temp = url.split("/");
            temp.pop();
            let token = temp.pop(),
                gid = temp.pop();
            return {
                "token": token,
                "gid": parseInt(gid)
            };
        }
        this.infoUrlToTokenAndGid = infoUrlToTokenAndGid;
        // 获取页面类型
        function getPageType(pathname) {
            let regList = [
                // 主界面 0-14
                /^\/$/,
                /^\/tag\/[^\/]+$/,
                /^\/uploader\/[^\/]+$/,
                /^\/doujinshi$/,
                /^\/manga$/,
                /^\/artistcg$/,
                /^\/gamecg$/,
                /^\/western$/,
                /^\/non-h$/,
                /^\/imageset$/,
                /^\/cosplay$/,
                /^\/asianporn$/,
                /^\/misc$/,
                /^\/popular$/,
                /^\/favorites.php$/,
                // 预览界面 15
                /^\/g\/[^\/]+\/[^\/]+\/$/,
                // 图片预览界面 16
                /^\/s\/[^\/]+\/[^\/]+$/
            ];
            for (let key in regList) {
                if (regList[key].test(pathname)) {
                    return parseInt(key);
                }
            }
            return -1;
        }
        this.getPageType = getPageType;
        // 搜索时如果你屏蔽某一个类型,网址栏里就会出现f_cats的字样,可以把里面的值拿过来解析
        function parseSearchCat(n) {
            n = parseInt(n);
            let typeList = {1:"Misc",2:"Doujinshi",4:"Manga",8:"Artist CG",16:"Game CG",32:"Image Set",64:"Cosplay",128:"Asian Porn",256:"Non-H",512:"Western"};
            let hashList = {
                "Misc": true,
                "Doujinshi": true,
                "Manga": true,
                "Artist CG": true,
                "Game CG": true,
                "Image Set": true,
                "Cosplay": true,
                "Asian Porn": true,
                "Non-H": true,
                "Western": true
            };
            // 在竞赛学过,二进制都玩烂了
            while (n > 0) {
                let t = n & -n;
                n = n & (n - 1);
                hashList[typeList[t]] = false;
            }
            return hashList;
        }
        this.parseSearchCat = parseSearchCat;
    };
})();



XESB.download = (function () {
    return function (config={}) {
        class downloader {
            constructor({url, onload, onprogress, onerror, type="blob"}) {
                if(!url) {
                    throw new Error(`链接有误: "${url}"`);
                }
                this.url = new URL(url);
                this.onload = onload;
                this.onprogress = onprogress;
                this.onerror = onerror;
                this.type = type;
            }
            async start() {
                let that = this;
                return new Promise(function (resolve, reject) {
                    that.xhr = GM_xmlhttpRequest({
                        responseType: that.type,
                        url: that.url.toString(),
                        onerror: function (e) {
                            if(that.onerror) {
                                that.onerror("error", e);
                            }
                            reject(e);
                        },
                        ontimeout: function (e) {
                            if(that.onerror) {
                                that.onerror("timeout", e);
                            }
                            reject(e);
                        },
                        onprogress: function(e) {
                            if(e.readyState >= e.HEADERS_RECEIVED) {
                                if(that.onprogress) {
                                    if(e.lengthComputable) {
                                        that.onprogress(e.loaded, e.total, e);
                                    } else {
                                        that.onprogress(0, e.total, e);
                                    }
                                }
                            }
                        },
                        onload: function (xhr) {
                            if(that.onload) {
                                that.onload(xhr.response, xhr);
                            }
                            resolve(xhr.response);
                        }
                    });
                });
            }
            abort() {
                this.xhr.abort();
            }
        }
        this.downloader = downloader;

        async function checkQueue() {
            if(idleProcess.length==0||taskQueue.length==0) {
                return;
            }
            let id = idleProcess.shift();
            runningTasks[id] = taskQueue.shift();
            try {
                await runningTasks[id].start();
            } catch(err) {
                console.warn(err);
            } finally {
                idleProcess.push(id);
                checkQueue();
            }
        }
        this.checkQueue = checkQueue;

        function add(options) {
            taskQueue.push(new downloader(options));
            checkQueue();
        }
        this.add = add;

        let taskQueue = [];
        this.taskQueue = taskQueue;

        let runningTasks = [];
        this.runningTasks = runningTasks;

        let idleProcess = [];
        this.idleProcess = idleProcess;
        for(let i=0;i<config.processNum;i++) {
            idleProcess.push(i);
        }
    };
})();



XESB.page = (function () {
    async function cacheImage(fileIndex, blob) {
        if(!XESB.config.supportsCache) {
            return false;
        }
        if(blob) {
            await localforage.setItem(XESB.config.baseName+"_image_cache_"+fileIndex, blob);
            return blob;
        }
        return await localforage.getItem(XESB.config.baseName+"_image_cache_"+fileIndex);
    }
    class GalleryDownload {
        constructor(url) {
            this.url = url;
            this.ParseGallery = new api.ParseGallery(url);
            this.download = new XESB.download({processNum: 2});
        }
        async init() {
            await this.ParseGallery.init();
            return this;
        }
        // 因为exhentai特殊的时效性,所以解析完成后必须立即下载
        async start(rangeList, {processNum=2,saveMode=1}) {
            // 检测是否支持第二种下载方式
            if(!("showSaveFilePicker" in window)) {
                saveMode = 1;
            }
            // 检测是否使用解析全部全部关键字
            if(rangeList=="all") {
                rangeList = [{start:1,end:this.ParseGallery.pages}];
            }
            // 根据提供的范围来制作成一个队列
            // 例如 [{start:1,end:5},{start:10,end:15}] 会被解析成 [1,2,3,4,5,10,11,12,13,14,15]
            let parsePageQueue = [];
            for(let i in rangeList) {
                for(let j=rangeList[i].start;j<=rangeList[i].end;j++) {
                    parsePageQueue.push(j);
                }
            }

            // 检测是否下载完成
            async function checkOver() {
                if(files.list.fail.length+files.list.success.length==files.total) {
                    console.log("图片已全部下载完毕,开始压缩");
                    let zip = new JSZip();
                    let imgSet = zip.folder(that.ParseGallery.firstname.replace(/[\\\/]/g, " - "));
                    for(let i in files.list.success) {
                        imgSet.file(files.list.success[i][1].name, files.list.success[i][0], {
                            "blob": true
                        });
                    }
                    let zipBlob = await zip.generateAsync({
                        type: "blob"
                    });
                    console.log("压缩完毕,请等待浏览器提示");
                    if(saveMode==1) {
                        saveAs(zipBlob, that.ParseGallery.firstname.replace(/[\\\/]/g, " - "));
                    }
                    if(saveMode==2) {
                        let file = (
                            await showSaveFilePicker({
                                suggestedName: that.ParseGallery.firstname.replace(/[\\\/]/g, " - ")+".zip",
                                types: []
                            })
                        ).createWritable();
                        file.write(zipBlob);
                    }
                }
            }
            // 下载成功回调
            function downloadSuccess(source, picInfo) {
                cacheImage(picInfo.fileIndex, source);
                files.list.success.push([source, picInfo]);
                console.log("下载成功", files.list.fail.length+files.list.success.length, files.total);
                checkOver();
            }
            // 下载失败回调
            function downloadFail(pageInfo, xhr, page) {
                files.list.fail.push([pageInfo, xhr, page]);
                console.log("下载失败", files.list.fail.length+files.list.success.length, files.total);
                checkOver();
            }
            // 尝试备用链接
            async function trySpare(pageInfo, page) {
                let sparePageInfo = await pageInfo.loadSpare();
                that.download.add({
                    url: sparePageInfo.url,
                    onload: function (source, xhr) {
                        if(xhr.status!=200) {
                            downloadFail(pageInfo, xhr, page);
                        }
                        downloadSuccess(source, sparePageInfo);
                    },
                    onerror: function (type, xhr) {
                        downloadFail(pageInfo, xhr, page);
                    }
                });
            }
            // 开始下载
            async function startDownload(pageInfo, page) {
                console.log("开始下载", page);
                if(XESB.config.supportsCache) {
                    let imgBlob = await cacheImage(pageInfo.pic.fileIndex);
                    if(imgBlob) {
                        console.log("调取缓存", page);
                        downloadSuccess(imgBlob, pageInfo.pic);
                        return;
                    }
                }
                that.download.add({
                    url: pageInfo.pic.url,
                    onload: function (source, xhr) {
                        // 正常加载了,但是不是很正常
                        if(xhr.status!=200) {
                            trySpare(pageInfo, page);
                        }
                        downloadSuccess(source, pageInfo.pic);
                    },
                    onerror: function (type, xhr) {
                        trySpare(pageInfo, page);
                    }
                });
            }
            // 开始解析
            async function startParse() {
                while(parsePageQueue.length!=0) {
                    let page = parsePageQueue.shift();
                    console.log("开始解析", page);
                    let pageInfo = await that.ParseGallery.get(page);
                    startDownload(pageInfo, page);
                }
            }
            let files = {};
            files.total = parsePageQueue.length;
            files.list = {success: [], fail:[]};

            let that = this;
            for(let i=0;i<processNum;i++) {
                startParse();
            }
        }
    }

    let api = new XESB.api();
    let pageType = api.getPageType(location.pathname);
    if(pageType==15) {
        let downloadBtn = $(`<a>开始下载</a>`);
        let downloadBox = $(`<p class="g2 gsp"><img src="https://ehgt.org/g/mr.gif"> </p>`);
        downloadBox.append(downloadBtn);
        downloadBtn.click(async function () {
            let a = new GalleryDownload(location.href);
            await a.init();
            await a.start("all", {});
        });

        $("#gd5").append(downloadBox);
    }
})();



unsafeWindow.XESB = XESB;
