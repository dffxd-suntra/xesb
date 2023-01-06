// ==UserScript==
// @name         xesb 2.0.0
// @author       Suntra
// @version      2.0.0
// @namespace    https://github.com/dffxd-suntra/xesb
// @description  exhentai/e-hentai 油猴插件,可以批量爬取图片,并且开发了预览功能
// @homepage     https://github.com/dffxd-suntra/xesb
// @match        *://exhentai.org/*
// @match        *://e-hentai.org/*
// @match        *://exhentai55ld2wyap5juskbm67czulomrouspdacjamjeloj7ugjbsad.onion/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.6.3/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js
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
// @connect      exhentai55ld2wyap5juskbm67czulomrouspdacjamjeloj7ugjbsad.onion
// @connect      hath.network
// @license      GNU GPLv3
// ==/UserScript==

/**
 * 初中生,第不知道多少次做前后端,变量名也都比较乱,类也没有一个明确的结构,主要原因是急急急急急急,原来的脚本失效了,这个是我花两天时间编写的
 * 友好的我告诉你，程序的入口请搜索"========== 程序入口 =========="
 * 还有,油猴的编辑器太难用辣!!!有什么好用一点的编辑器或者怎么滴就用vscode编辑的方法请告诉我!
 */
(function() {
    // 脚本配置
    let config = {
        debug: true,
        name: "xesb"
    };










    // ========== 网络类 ==========
    // 解析网址search部分
    // 我这个不实现多个同样键值的功能,因为exhentai用不到
    // 实现基本增删查改功能
    class searchParse {
        // 实现多个网址合并之术
        constructor() {
            // 只给location.search或装着location.search的数组
            this.searchMap = new Map();
            for (let i in arguments) {
                if (!(arguments[i].constructor === String)) {
                    continue;
                }
                let search = arguments[i].substring(arguments[i].indexOf("?")+1);
                let searchMap = this.toMap(search);
                for (let [key, value] of searchMap.entries()) {
                    this.searchMap.set(key, value);
                }
            }
        }
        // 网址search部分转map
        toMap(search) {
            if(search=="") {
                return new Map();
            }
            let pairs = search.split("&");
            let searchMap = new Map();
            for (let key in pairs) {
                let temp = pairs[key].split("=");
                temp[0] = decodeURIComponent(temp[0]) || "";
                temp[1] = decodeURIComponent(temp[1]) || "";
                searchMap.set(temp[0], temp[1]);
            }
            return searchMap;
        }
        // map转网址search部分的字符串
        toString(searchMap) {
            let search = "";
            for (let [key, value] of searchMap.entries()) {
                search +=encodeURIComponent(key)+"="+encodeURIComponent(value)+"&";
            }
            search = search.substr(0, search.length-1);
            return search;
        }
        // 设置值,支持传入object批量设置
        set(key, value) {
            if (key.constructor === Object&&value === undefined) {
                for (let i in key) {
                    this.set(i, key[i]);
                }
            }
            this.searchMap.set(key, value);
            return this;
        }
        // 删除值,支持传入array批量删除
        remove(key) {
            if (key.constructor === Array) {
                for(let i in key) {
                    this.remove(key[i]);
                }
            }
            let value = this.searchMap.get(key);
            this.searchMap.delete(key);
            return this;
        }
        // 获取值,支持传入array批量获取
        get(key) {
            if (key.constructor === Array) {
                let values = [];
                for (let i in key) {
                    values[i] = this.get(key[i]);
                }
                return values;
            }
            return this.searchMap.get(key);
        }
        // 多出来的exobj只能是object,你要是突然想创建一个constructor的键请去this.set
        // 类似于 b+1;和b++;的区别,一个是零时用一下,另一个是实际修改
        getSearch(exobj = {}) {
            // 深复制,避免影响本体
            let searchMap = _.cloneDeep(this.searchMap);
            for (let i in exobj) {
                searchMap.set(i, exobj[i]);
            }
            return this.toString(searchMap);
        }
    }
    // 注意!解析出来是xml的document,不带script,因为html解析出来不严谨,不能用,自己用一次parseHtml就知道了
    class ParseHtml {
        // 去除script标签避免解析错误
        strRemoveScript(str) {
            return str.replace(/(<script(.*?)>)(.|\n)*?(<\/script>)/g, "");
        }
        //字符串转化为xml
        toXmlDom(source) {
            var xmlDoc = null;
            if (window.ActiveXObject) {
                var ARR_ACTIVEX = ["MSXML4.DOMDocument", "MSXML3.DOMDocument", "MSXML2.DOMDocument", "MSXML.DOMDocument", "Microsoft.XmlDom"];
                var XmlDomflag = false;
                for (var i = 0; i < ARR_ACTIVEX.length && !XmlDomflag; i++) {
                    try {
                        var objXML = new window.ActiveXObject(ARR_ACTIVEX[i]);
                        xmlDoc = objXML;
                        XmlDomflag = true;
                    } catch (e) {}
                }
                if (xmlDoc) {
                    xmlDoc.async = false;
                    xmlDoc.loadXML(source);
                }
            } else {
                var parser = new DOMParser();
                xmlDoc = parser.parseFromString(source, "text/xml");
            }
            return xmlDoc;
        }
        getDocument(url) {
            let that = this;
            return new Promise(function (resolve, reject) {
                $.get({
                    url: url,
                    dataType : "text",
                    success: function (result, status, xhr) {
                        let xmldocument = that.toXmlDom(that.strRemoveScript(result));
                        resolve(xmldocument);
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
    // ========== 网络类 ==========










    // ========== e-hentai exhentai解析部分 ==========
    // 解析普通页面
    class ParsePage extends ParseHtml {
        // 传入完整链接
        constructor(url) {
            super();
            this.info = {};
            this.data = {};
            this.url = url;
            this.urlInfo = getUrlInfo(url);
            this.urlInfo.searchInfo = new searchParse(url);
            // 有效数字或NaN
            this.next = parseInt(this.urlInfo.searchInfo.get("next"));
            // 当前是哪一种页面的
            this.page = this.getPage();
            if(this.page==-1) {
                throw new Error("请给正确的网址!");
            }
            this.mode = "";
            this.modeLabel = {"m": "Minimal", "p": "Minimal+", "l": "Compact", "e": "Extended", "t": "Thumbnail"};
            this.selector = {};
            this.xmldocument = null;
        }
        // 判断url为哪个页面
        getPage() {
            let regList = [
                // 主界面 0-12
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
                // 主页面变种 13-14
                /^\/popular$/,
                /^\/favorites.php$/
            ];
            for (let key in regList) {
                if (regList[key].test(this.urlInfo.pathname)) {
                    return parseInt(key);
                }
            }
            return -1;
        }
        // 根据用户的个人设置和页面初始化选择器
        selectorInit() {
            if(0<=this.page&&this.page<=13) {
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
                    dlast: "#dlast",
                    searchbox: "#searchbox",
                    rangebar: "#rangebar",
                    mode: ".searchnav > div > select",
                };

                this.mode = this.modeLabel[$(this.selector.mode, this.xmldocument).val()];
                if(this.mode == "Minimal"||this.mode == "Minimal+") {
                    // table会被浏览器自动加上tbody等,但是
                    this.selector.infoContainer = "body > div.ido > div > table.itg.gltm";
                    this.selector.infos = this.selector.infoContainer+" > tr";
                }
                if(this.mode == "Compact") {
                    // table会被浏览器自动加上tbody等,但是
                    this.selector.infoContainer = "body > div.ido > div > table.itg.gltc";
                    this.selector.infos = this.selector.infoContainer+" > tr";
                }
                if(this.mode == "Extended") {
                    // table会被浏览器自动加上tbody等,但是
                    this.selector.infoContainer = "body > div.ido > div > table.itg.glte";
                    this.selector.infos = this.selector.infoContainer+" > tr";
                }
                if(this.mode == "Thumbnail") {
                    this.selector.infoContainer = "body > div.ido > div > div.itg.gld";
                    this.selector.infos = this.selector.infoContainer+" > div";
                }
            }
            if(this.page==14) {
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
                    dlast: "#dlast",
                    order: ".searchnav > div > select:contains('Published Time')",
                    mode: ".searchnav > div > select:contains('Minimal')",
                };

                this.mode = this.modeLabel[$(this.selector.mode, this.xmldocument).val()];
                if(this.mode == "Minimal"||this.mode == "Minimal+") {
                    // table会被浏览器自动加上tbody等,但是
                    this.selector.infoContainer = "#favform > table.itg.gltm";
                    this.selector.infos = this.selector.infoContainer+" > tr";
                }
                if(this.mode == "Compact") {
                    // table会被浏览器自动加上tbody等,但是
                    this.selector.infoContainer = "#favform > table.itg.gltc";
                    this.selector.infos = this.selector.infoContainer+" > tr";
                }
                if(this.mode == "Extended") {
                    // table会被浏览器自动加上tbody等,但是
                    this.selector.infoContainer = "#favform > table.itg.glte";
                    this.selector.infos = this.selector.infoContainer+" > tr";
                }
                if(this.mode == "Thumbnail") {
                    this.selector.infoContainer = "#favform > div.itg.gld";
                    this.selector.infos = this.selector.infoContainer+" > div";
                }
            }
            return this;
        }
        infoToUrl(info) {
            return $(info).find(".glink").parent("a[href]").attr("href") || false;
        }
        infoToName(info) {
            return $(info).find(".glink").text() || false;
        }
        // 根据画廊链接判断token和gid
        urlToTokenAndGid(url) {
            let temp = url.split("/");
            temp.pop();
            let token = temp.pop(),
                gid = temp.pop();
            return {
                "token": token,
                "gid": parseInt(gid)
            };
        }
        // 根据选择器来解析页面节点
        parseNode() {
            let info = this.info;
            for(let i in this.selector) {
                if(i=="infos") {
                    continue;
                }
                info[i] = $(this.selector[i]).get(0);
            }
            info.infos = $(this.selector.infos, this.xmldocument).get();
            if(this.mode == "Minimal"||this.mode == "Minimal+"||this.mode == "Compact") {
                info.infos.shift();
            }
        }
        // 解析页面的节点并转化为数据
        parseInfo() {
            let typeLabel = {
                "ct1": "Misc",
                "ct2": "Doujinshi",
                "ct3": "Manga",
                "ct4": "Artist CG",
                "ct5": "Game CG",
                "ct6": "Image Set",
                "ct7": "Cosplay",
                "ct8": "Asian Porn",
                "ct9": "Non-H",
                "cta": "Western"
            };
            let that = this;
            this.data.infos = [];
            for(let i in this.info.infos) {
                this.data.infos[i] = {
                    name: that.infoToName(that.info.infos[i]),
                    url: that.infoToUrl(that.info.infos[i]),
                    cover: $(that.info.infos[i]).find(`img[alt="${that.infoToName(that.info.infos[i])}"]`).attr("src"),
                    pages: parseInt($($(that.info.infos[i]).find(":contains('pages')").get().find(node => /^\d+ pages$/g.test($(node).text())&&!$(node).hasClass("glink"))).text().split(" ")[0]),
                    hasTorrents: ($(that.info.infos[i]).find(".gldown > img").attr("title")=="No torrents available"?false:true),
                };

                let temp = this.urlToTokenAndGid(this.data.infos[i].url);
                this.data.infos[i].gid = temp.gid;
                this.data.infos[i].token = temp.token;

                this.data.infos[i].date = $(this.info.infos[i]).find("#posted_"+this.data.infos[i].gid).text();

                this.data.infos[i].favorite = $(this.info.infos[i]).find("#posted_"+this.data.infos[i].gid).attr("title") || "";

                // https://ehgt.org/img/rt.png
                // 标签的星星为正方形,边长16,第一行离图片上边框1px,两行间隔4px,最后一行离图片下边框1px,星星之间无距离,第一个星星离图片左边框无距离,第一行最后一个星星离右边框无距离,第二行比第一行少一个星星
                // 计算星星公式: score = 5-x/16-(y==-21?0.5:0); x. y分别对应css的背景定位中的x和y,别忘了字符串转int
                this.data.infos[i].fuzzyRating = $(this.info.infos[i]).find("div.ir").get(0);
                this.data.infos[i].fuzzyRating = 5 - Math.abs(parseInt(this.data.infos[i].fuzzyRating.style.backgroundPositionX))/16 - (parseInt(this.data.infos[i].fuzzyRating.style.backgroundPositionY)==-21?0.5:0);

                for(let j in typeLabel) {
                    if($(that.info.infos[i]).find(".cs").hasClass(j)) {
                        this.data.infos[i].type = typeLabel[j];
                        break;
                    }
                }
            }
            this.data.firstPageUrl = $(this.info.ufirst).attr("href") || this.url;
            this.data.lastPageUrl = $(this.info.ulast).attr("href") || this.url;
            this.data.prevPageUrl = $(this.info.uprev).attr("href");
            this.data.nextPageUrl = $(this.info.unext).attr("href");
        }
        // 解析总的调用
        parse() {
            // 先解析所有的节点 this.info
            this.parseNode();
            // 再解析节点里的信息 this.data
            this.parseInfo();
            return this;
        }
        // 初始化
        async init() {
            this.xmldocument = await this.getDocument(this.url);
            this.selectorInit();
            this.parse();
            return this;
        }
    }

    // 解析画廊界面
    class ParseGallery extends ParseHtml {
        constructor(url) {
            super();
            this.info = {};
            this.data = {page: []};
            this.url = url;
            this.urlInfo = getUrlInfo(url);
            this.urlInfo.searchInfo = new searchParse(url);
            if(!(/^\/g\/[^\/]+\/[^\/]+\/$/.test(this.urlInfo.pathname))) {
                throw new Error("请给我正确的网址!!!");
                return;
            }
            this.xmldocument = null;
            this.selector = {};
        }
        // 根据用户设置初始化选择器
        selectorInit() {
            this.selector = {
                // 没有head是因为head的东西太多了,会影响判断,而且大部分都有对应的id
                body: "#gdt",
                foot: "#cdiv",

                firstName: "#gn",
                secendName: "#gj",
                cover: "#gd1 > div", // 提取它的css:background字符串并且运行正则表达式 "/^url([/s/S]*)$/" 即可提取封面
                type: "#gdc > div",
                auther: "#gdn > a",
                infos: "#gdd > table",
                rating: "#gdr > table",
                addToFavorites: "#gdf",
                tag: "#taglist > table",
                headSidebar: "#gd5", // 太多了,自己找去吧

                rows: "#gdo2", // 我从来没见过能调几行的时候,可能我等级太低了把
                mode: "#gdo4",

                comment: "#cdiv"
            };
            this.mode = $(this.selector.mode, this.xmldocument).find(".tha").text();
            if(this.mode == "Normal") {
                this.selector.preview = ".gdtl";
            } else {
                this.selector.preview = ".gdtm";
            }
        }
        // 解析页面节点
        parseNode() {
            for(let i in this.selector) {
                if(i=="preview") {
                    continue;
                }
                this.info[i] = $(this.selector[i], this.xmldocument).get(0);
            }
        }
        // 解析用户评论以及作者的话
        parseComment() {
            let commentList = [];
            let monList = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
            $(this.info.comment).children(".c1").each(function (index, node) {
                let sp = $(node).find(".c2 > .c3").text().split(" ");
                let timestamp = new Date();
                let spt = sp[5].split(":");
                timestamp.setFullYear(parseInt(sp[4]));
                timestamp.setMonth(parseInt(monList.indexOf(sp[3])));
                timestamp.setDate(parseInt(sp[2]));
                timestamp.setHours(parseInt(spt[0]));
                timestamp.setMinutes(parseInt(spt[1]));
                let score = $(node).find(".c2 > .nosel");
                let type;
                // console.log($(score));
                if($(score).hasClass("c4")) {
                    type = 0;
                    score = null;
                }
                if($(score).hasClass("c5")) {
                    type = 1;
                    score = parseInt(score.find("span").text());
                }
                commentList.push({
                    uploder: {
                        name: $(node).find(".c2 > .c3 > a").text(),
                        url: $(node).find(".c2 > .c3 > a").attr("href")
                    },
                    content: $(node).find(".c6").text(),
                    score: score,
                    type: type,
                    timestamp: timestamp.getTime()
                });
            });
            this.data.comment = commentList;
        }
        // 解析画廊标签
        parseTag() {
            let tagList = {};
            $("tr", this.info.tag).each(function (index, node) {
                let title = $(node).find(".tc").text().split(":")[0];
                let tags = [];
                $(node).find("td > div").each(function (index, node) {
                    let type, name, url;
                    url = $(node).find("a").attr("href");
                    name = $(node).attr("id").split(":").pop();
                    // 完整的边框
                    if($(node).hasClass("gt")) {
                        type = 0;
                    }
                    // 长条边框
                    if($(node).hasClass("gtl")) {
                        type = 1;
                    }
                    // 点边框
                    if($(node).hasClass("gtw")) {
                        type = 2;
                    }
                    tags.push({
                        type: type,
                        name: name,
                        url: url
                    });
                });
                tagList[title] = tags;
            });
            this.data.tag = tagList;
        }
        // 解析画廊数据
        parseInfo() {
            let infos = {};
            $("tr", this.info.infos).each(function (index, node) {
                infos[$(node).find(".gdt1").text().split(":")[0]] = $(node).find(".gdt2").text();
            });
            this.data.infos = infos;
        }
        // 解析画廊分数
        parseRating() {
            this.rating = parseFloat($(this.info.rating).find("#rating_label").text().split(" ")[1]);
            this.ragingCount = parseInt($(this.info.rating).find("#rating_count").text());
        }
        // 解析一个总的调用
        parse() {
            this.parseNode();
            this.parseTag();
            this.parseComment();
            this.parseInfo();
            this.parseRating();

            // 获取基本的数据
            this.firstname = $(this.info.firstName).text();
            this.secendName = $(this.info.secendName).text();
            this.cover = $(this.info.cover).attr("style").match(/(?<=url\().*(?=\))/g)[0];
            this.type = $(this.info.type).text();
            this.auther = $(this.info.auther).text();
            this.autherUrl = $(this.info.auther).attr("href");
            this.pages = parseInt(this.data.infos.Length);
            this.limit = $(this.info.body).children(this.selector.preview).length;
            return this;
        }
        // 初始化
        async init() {
            this.xmldocument = await this.getDocument(this.urlInfo.origin+this.urlInfo.pathname+"?hc=1");
            this.selectorInit();
            this.parse();
            return this;
        }
        // 获取画廊某一页的数据,包括图片宽高(压缩后的),图片链接(压缩后的),原图链接,图片名称,图片索引(图片唯一标识,程序员可以以此创建缓存)
        async getPage(page) {
            if(page<1||this.pages<page) {
                throw new Error(`输入的正确的范围1-${this.pages}`);
            }
            let pageInfos = this.data.page;

            // 获取某一张图片所在页面对应的url
            if(pageInfos[page-1] == undefined) {
                let pager = Math.floor((page-1)/this.limit);
                let xmldocument = await this.getDocument(this.urlInfo.origin+this.urlInfo.pathname+"?p="+pager);
                let start = this.limit*pager;
                $(this.selector.body+" > "+this.selector.preview, xmldocument).each(function (index, node) {
                    pageInfos[start+index] = {pageUrl: $(node).find("a").attr("href")};
                });
            }

            // 获取图片信息(如果没有存起来的话
            if(pageInfos[page-1].pic == undefined) {
                let xmldocument = await this.getDocument(pageInfos[page-1].pageUrl);
                let pic = $("#img", xmldocument).get(0);
                pageInfos[page-1].pic = {
                    url: $(pic).attr("src"),
                    full: $("#i7 > a", xmldocument).attr("href"),
                    width: parseInt(pic.style.width),
                    height: parseInt(pic.style.height),
                    name: $(pic).attr("src").split("/").pop(),
                    fileIndex: parseInt($(pic).attr("src").match(/(?<=fileindex=).*(?=;xres=)/g)[0])
                };
            }
            return pageInfos[page-1];
        }
    }
    // 页面选择器,单出一个这个是因为用户的页面通常都会有更多的处理和解析,和ajax获取到的就不一样,这个是专门为解析后的html所建
    // 比如tabel,就会被加上tbody
    class PageSelector {
        constructor(docuemnt) {
        }
    }
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
        while (n > 0) {
            let t = n & -n;
            n = n & (n - 1);
            hashList[typeList[t]] = false;
        }
        return hashList;
    }
    // ========== e-hentai exhentai解析部分 ==========










    // ========== 缓存 ==========
    // ========== 缓存 ==========










    // ========== 普通函数 ===========
    // 动态加载js(不知道这种写法是否有效
    function loadJs(url) {
        let js = $(`<script crossorigin="anonymous"></script>`);
        js.attr("src", url);
        $(document.body).append(js);
        return js;
    }
    // 动态加载css
    function loadCss(url) {
        let css = $(`<link rel="stylesheet" crossorigin="anonymous">`);
        css.attr("href", url);
        $(document.body).append(css);
        return css;
    }
    // 用户的window,不是自己这里有代理的
    function getWindow() {
        return new Function("return this;")();
    }
    // 根据图片的链接获取链接的信息,自己看吧
    function getUrlInfo(url) {
        let a = $("<a></a>").attr("href", url).get(0);
        return {
            hash: a.hash,
            host: a.host,
            hostname: a.hostname,
            href: a.href,
            origin: a.origin,
            pathname: a.pathname,
            port: a.port,
            protocol: a.protocol,
            search: a.search
        };
    }
    function textToBlob(text) {
        return new Blob([text]);
    }
    // ========== 普通函数 ===========










    // ========== 调试部分 ===========
    // 将变量映射到开发者的window,这样好调试
    function debug() {
        // jquery
        uwindow.$ = $;
        // lodash
        uwindow._ = _;
        uwindow.xesb = {
            // url解析
            searchParse: searchParse,
            // html解析,不会直接用这个
            ParseHtml: ParseHtml,
            // 解析普通页面,引用ParseHtml,为ajax所用,传回的dom不是本页面的
            ParsePage: ParsePage,
            // 解析画廊详情,引用ParseHtml,为ajax所用,传回的dom不是本页面的
            ParseGallery: ParseGallery,
            // 页面选择器,可以选择页面重要的信息
            PageSelector: PageSelector,
            script_window: window
        };
    }
    // ========== 调试部分 ===========











    // ========== 程序入口 ==========
    // 初始化
    // 获取用户的window为uwindow
    let uwindow = getWindow();
    // 本来想重构ui,但是不好办,算了
    // loadCss(`https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.css`);
    // loadJs(`https://cdn.jsdelivr.net/npm/semantic-ui@2.5.0/dist/semantic.min.js`);
    if(config.debug) {
        debug();
    }
})();
