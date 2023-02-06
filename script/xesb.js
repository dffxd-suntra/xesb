if (this.constructor === this.ServiceWorkerGlobalScope) {
    importScripts("vwj.js");
    importScripts("moment.min.js");
    importScripts("zh-cn.moment.js");
    importScripts("jszip.min.js");
    /* for (let i in window) { // 禁用毫无影响,不要NTR!!!
        globalThis[i] = globalThis[i] || window[i];
    } */
    console.log("以Service Worker启动(v3)", window);
} else {
    console.log("以页面启动(v2)", window);
}

const XESB = (function () {
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
                return new window.DOMParser().parseFromString(source, "text/html");
            }
            getDocument(url, script = true) {
                let that = this;
                return fetch(url)
                    .then(response => response.text())
                    .then(function (data) {
                        if (!script) {
                            data = that.toDocuemnt(that.strRemoveScript(data));
                        }
                        return that.toDocuemnt(data);
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
                this.pageType = getPageType(this.url);

                // 判断合法性
                if (this.pageType == -1 || 14 < this.pageType) {
                    throw new Error(`您的地址不对劲: "${url}"`);
                }

                // 一些网页的节点
                this.nodes = {};

                // 画廊的详细信息
                this.galleryInfo = [];

                // 正整数或NaN
                this.next = parseInt(this.url.searchParams.get("next"));

                // 浏览模式的标签
                this.modeLabel = { "m": "Minimal", "p": "Minimal+", "l": "Compact", "e": "Extended", "t": "Thumbnail" };
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
                if (0 <= this.pageType && this.pageType <= 12) {
                    this.selector.searchbox = "#searchbox";
                    this.selector.rangebar = "#rangebar";
                    this.selector.mode = ".searchnav > div > select";
                    this.selector.container = "body > div.ido > div";
                }

                // 流行页面
                if (this.pageType == 13) {
                    this.selector.mode = ".searchnav > div > select";
                    this.selector.container = "body > div.ido > div";
                }

                // 特殊的收藏页面
                if (this.pageType == 14) {
                    this.selector.order = ".searchnav > div > select:contains('Published Time')";
                    this.selector.mode = ".searchnav > div > select:contains('Minimal')";
                    this.selector.container = "#favform";
                }

                // 获取浏览模式
                this.mode = this.modeLabel[$(this.selector.mode, this.pageDocuemnt).val()];
                // 前四种本质上就是html table,解析出来会被自动添加tbody
                if (this.mode == "Minimal" || this.mode == "Minimal+") {
                    this.selector.infoContainer = this.selector.container + " > table.itg.gltm";
                    this.selector.infos = this.selector.infoContainer + " > tbody > tr";
                }
                if (this.mode == "Compact") {
                    this.selector.infoContainer = this.selector.container + " > table.itg.gltc";
                    this.selector.infos = this.selector.infoContainer + " > tbody > tr";
                }
                if (this.mode == "Extended") {
                    this.selector.infoContainer = this.selector.container + " > table.itg.glte";
                    this.selector.infos = this.selector.infoContainer + " > tbody > tr";
                }
                // 后一种就是真的排出来的
                if (this.mode == "Thumbnail") {
                    this.selector.infoContainer = this.selector.container + " > div.itg.gld";
                    this.selector.infos = this.selector.infoContainer + " > div";
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
                    this.galleryInfo[i].categories = $(infos[i]).find(".cs").text();

                    // 封面链接
                    this.galleryInfo[i].cover = $(infos[i]).find(`img[alt="${this.galleryInfo[i].name}"]`).attr("src");

                    // 页数
                    this.galleryInfo[i].pages = parseInt($($(infos[i]).find(":contains('pages')").get().find(node => /^\d+(?= pages$)/g.test($(node).text()) && !$(node).hasClass("glink") && $(node).find(".glink").length == 0)).text());

                    // 是否有种子
                    this.galleryInfo[i].hasTorrents = $(infos[i]).find(".gldown").children("a").length != 0;

                    // token和gid
                    let temp = infoUrlToTokenAndGid(this.galleryInfo[i].url);
                    this.galleryInfo[i].gid = temp.gid;
                    this.galleryInfo[i].token = temp.token;

                    // 上传时间的时间戳
                    this.galleryInfo[i].postTime = moment($(infos[i]).find("#posted_" + this.galleryInfo[i].gid).text()).valueOf();

                    // 收藏夹名称,不在则是空字符串
                    this.galleryInfo[i].favorite = $(infos[i]).find("#posted_" + this.galleryInfo[i].gid).attr("title") || "";

                    // 大概的分数 总量5 分度值0.5
                    // https://ehgt.org/img/rt.png
                    // 标签的星星为正方形,边长16,第一行离图片上边框1px,两行间隔4px,最后一行离图片下边框1px,星星之间无距离,第一个星星离图片左边框无距离,第一行最后一个星星离右边框无距离,第二行比第一行少一个星星
                    // 计算星星公式: score = 5-x/16-(y==-21?0.5:0); x. y分别对应css的背景定位中的x和y,别忘了字符串转int
                    let [x, y] = $(infos[i]).find("div.ir").get(0).style.backgroundPosition.match(/-?\d+(?=px)/g);

                    this.galleryInfo[i].fuzzyRating = 5 - Math.abs(parseInt(x)) / 16 - (parseInt(y) == -21 ? 0.5 : 0);
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
                this.pageType = getPageType(this.url);

                // 判断合法性
                if (this.pageType != 16) {
                    throw new Error(`您的地址不对劲: "${url}"`);
                }

                // 图片信息
                this.pic = {};

                // 检查是否被屏蔽
                this.is509 = false;
            }
            // 解析页面和图片信息
            parse() {
                // 当前为第几页
                this.page = parseInt($("#i2 > div.sn > div", this.pageDocuemnt).text());

                // 图片节点
                let pic = $("#img", this.pageDocuemnt).get(0);

                let picInfo = this.pic;

                // 图片链接
                picInfo.url = $(pic).attr("src");

                // 图片名称
                picInfo.name = new URL(picInfo.url).pathname.split("/").pop();
                if (picInfo.name == "509.gif") {
                    this.pic = {};
                    this.is509 = true;
                    return false;
                }

                // 图片宽度
                picInfo.width = parseInt(pic.style.width);

                // 图片高度
                picInfo.height = parseInt(pic.style.height);

                // 原图链接
                picInfo.full = $("#i7 > a", this.pageDocuemnt).attr("href") || null;

                if (picInfo.full != null) {
                    // 正则表达式获取完整图片宽高
                    let temp1 = $("#i7 > a", this.pageDocuemnt).text().match(/^Download original (\d+) x (\d+) (.*) source$/);
                    picInfo.fullWidth = parseInt(temp1[1]);
                    picInfo.fullHeight = parseInt(temp1[2]);
                } else {
                    picInfo.fullWidth = null;
                    picInfo.fullHeight = null;
                }

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
                let url = new URL(this.url.origin + this.url.pathname);
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

                // 完整宽度
                picInfo.fullWidth = this.pic.fullWidth;

                // 完整高度
                picInfo.fullHeight = this.pic.fullHeight;

                // 图片索引
                picInfo.fileIndex = this.pic.fileIndex;

                // 画廊地址
                picInfo.galleryUrl = this.pic.galleryUrl;

                return picInfo;
            }
            async init() {
                // 获取文档
                this.pageDocuemnt = await this.getDocument(this.url.origin + this.url.pathname);

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
                this.pageType = getPageType(this.url);

                // 判断合法性
                if (this.pageType != 15) {
                    throw new Error(`您的地址不对劲: "${url}"`);
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

                    mainName: "#gn",
                    secondaryName: "#gj",
                    cover: "#gd1 > div",
                    categories: "#gdc > div",
                    uploader: "#gdn > a",
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
                if (this.mode == "Normal") {
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
                this.mainName = this.nodes.mainName.text();

                // 副名称
                this.secondaryName = this.nodes.secondaryName.text();

                // 封面地址
                this.cover = this.nodes.cover.get(0).style.background.match(/(?<=url\("*).*(?="*\))/g)[0].replaceAll("\"", "");

                // 画廊类别(例如 Image Set
                this.categories = this.nodes.categories.text();

                // 作者名
                this.uploader = this.nodes.uploader.text() || null;

                // 作者链接
                this.uploaderUrl = this.nodes.uploader.attr("href") || null;

                // 发送时间(时间戳
                this.postTime = moment(temp1.Posted.text()).valueOf();

                // 画廊继承的画廊(gid)(正整数或NaN
                this.parent = parseInt(temp1.Parent.text()) || null;

                // 画廊继承的画廊的链接
                this.parentUrl = temp1.Parent.children("a").attr("href") || null;

                // 是否可见(bool
                this.visible = temp1.Visible.text() == "Yes";

                // 语言
                this.language = temp1.Language.text().split(" ")[0];

                // 是否是翻译过来的
                this.isTranslation = temp1.Language.children("span").length != 0;

                // 文件大小
                this.fileSize = toByte(temp1["File Size"].text().split(" "));

                // 图片页数
                this.pages = parseInt(temp1.Length.text());

                // 放进收藏夹的人数
                this.favorited = parseInt(temp1.Favorited.text());

                // 放在哪个收藏夹里 空字符串或具体名字(总共就十个嘛)
                this.favorites = this.nodes.addToFavorites.text().trim().replace("Add to Favorites", "");

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
                        let credit;
                        // 完整的边框
                        if ($(node).hasClass("gt")) {
                            credit = 0;
                        }
                        // 长条边框
                        if ($(node).hasClass("gtl")) {
                            credit = 1;
                        }
                        // 点边框
                        if ($(node).hasClass("gtw")) {
                            credit = 2;
                        }
                        that.tags[title].push({
                            credit: credit,
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
                    if (id == 0) {
                        type = 0;
                    } else {
                        type = 1;
                        score = parseInt($(node).find("#comment_score_" + id).text());
                    }
                    that.comments.push({
                        id: id,
                        uploder: {
                            name: $(node).find(".c2 > .c3 > a").text() || null,
                            url: $(node).find(".c2 > .c3 > a").attr("href") || null
                        },
                        content: $(node).find(".c6").text(),
                        score: score,
                        type: type,
                        postTime: timestamp.valueOf()
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
                this.pageDocuemnt = await this.getDocument(this.url.origin + this.url.pathname + "?hc=1");

                // 获取解析器字符串
                this.selectorInit();

                // 解析页面
                this.parse();

                return this;
            }
            // 获取图片页面信息
            async get(page, cache = true) {
                // 检测范围
                if (page < 1 || this.pages < page) {
                    throw new Error(`输入的正确的范围1-${this.pages}`);
                }

                let pageInfo = this.pageInfo;
                let pageUrl = this.pageUrl;

                // 获取某一张图片所在页面对应的url
                if (pageUrl[page - 1] == undefined) {
                    let pager = Math.floor((page - 1) / this.limit);
                    let pageDocuemnt = await this.getDocument(this.url.origin + this.url.pathname + "?p=" + pager);
                    let start = this.limit * pager;
                    $(this.selector.body + " > " + this.selector.preview, pageDocuemnt).each(function (index, node) {
                        pageUrl[start + index] = $(node).find("a").attr("href");
                    });
                }

                // 获取图片信息(如果没有存起来的话
                if (pageInfo[page - 1] == undefined && cache) {
                    pageInfo[page - 1] = new ParseImgPage(pageUrl[page - 1]);
                    await pageInfo[page - 1].init();
                }
                return pageInfo[page - 1];
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
        function getPageType(url) {
            if (url.constructor === String) {
                url = new URL(url);
            }
            let pathname = url.pathname;
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
            let typeList = { 1: "Misc", 2: "Doujinshi", 4: "Manga", 8: "Artist CG", 16: "Game CG", 32: "Image Set", 64: "Cosplay", 128: "Asian Porn", 256: "Non-H", 512: "Western" };
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
        function toByte(size, type) {
            if (!type) {
                [size, type] = size;
            }
            size = new Number(size);
            let unit = {
                "BYTE": 1,
                "KB": 1024,
                "MB": 1048576,
                "GB": 1073741824,
                "TB": 1099511627776,
                "PB": 1125899906842600,
            };
            return size * unit[type];
        }
    };
})();