// 真是第一次写啊!!!不知道怎么写啊!!!写的非常乱,以后肯定会整体重构的
class GalleryDownload {
    // 链接 下载范围 解析线程数量 下载线程数量 重试次数 下载压缩后的图片或原图 下载进度回调(解析成功,下载成功各调一次) 下载完成回调 下载不成功回调(每张图片调一次)
    constructor({ url, ranges = "all", parseProcessNum = 3, downloadProcessNum = 5, retriesNum = 3, type = "compressed", onprogress, onload, onerror }) {
        this.url = url;
        this.ranges = ranges;
        this.parseProcessNum = parseProcessNum;
        this.downloadProcessNum = downloadProcessNum;
        this.retriesNum = retriesNum;
        this.type = type;
        this.onprogress = onprogress || function () { };
        this.onload = onload || function () { };
        this.onerror = onerror || function () { };
        this.ParseGallery = new api.ParseGallery(url);
        this.download = new downloadFiles({ processNum: downloadProcessNum });
        this.files = { pages: [] };

        this.waitingQueue = [];
        this.runningQueue = [];
        this.errorQueue = [];
        this.completeQueue = [];
        this.parseProgress = 0;
        this.downloadProgress = 0;
    }
    // 开始下载
    start() {
        let that = this;
        // 算是异步地狱了,反正先把史糊上去再说,这么点重构也简单
        // 重构了,结果还是原来那种格式
        // 再难得就懒得写了(不会,没见过别人写这玩意)
        return new Promise(async function (bigresolve) {
            function checkEnd() {
                if (
                    /* // 确保等待队列里没有任务
                    that.waitingQueue.length == 0 &&
                    // 确保运行队列里没有任务
                    that.runningQueue.findIndex(v => v) == -1 &&
                    // 确保所有下载进程都为空闲
                    that.download.idleProcess.length == that.download.processNum &&
                    // 确保下载队列里没有东西
                    that.download.taskQueue.length == 0 */
                    that.total == that.downloadProgress &&
                    that.total == that.parseProgress
                ) {
                    that.onload(that);
                    bigresolve(that);
                }
            }
            async function downloadSuccess(pageInfo, page, retriesNum, blob) {
                if (blob.type.split("/")[0] != "image") {
                    downloadFail(pageInfo, page, retriesNum, new Error(`类型错误`));
                    return;
                }
                that.downloadProgress++;
                let picInfo = await SQL.addPic(blob, that.type, that.ParseGallery.gid, pageInfo);

                that.files.pages[page] = {
                    pic: picInfo,
                    info: pageInfo
                };
                that.completeQueue.push([page, retriesNum]);
                // console.log(page, that.files.pages[page]);
                that.onprogress(page, that);
                checkEnd();
            }
            function downloadFail(pageInfo, page, retriesNum, error) {
                // console.error("catched", e);
                that.onerror(page, retriesNum, error, that);
                if (retriesNum == 0) {
                    // 错误也算下载完成
                    that.downloadProgress++;
                    that.errorQueue.push([page, error]);
                    checkEnd();
                    return;
                }

                if (that.type == "compressed") {
                    downloadCompressed(pageInfo, page, retriesNum - 1);
                }
                if (that.type == "full") {
                    downloadFull(pageInfo, page, retriesNum - 1);
                }
            }
            // 下载完整的
            function downloadFull(pageInfo, page, retriesNum) {
                that.download.add({
                    url: pageInfo.pic.full,
                    onerror: function (error) {
                        downloadFail(pageInfo, page, retriesNum, error);
                    },
                    onload: function (data, response) {
                        if (response.status != 200 || data.type.split("/")[0] != "image") {
                            downloadFail(pageInfo, page, retriesNum, new Error(`状态或类型错误`));
                        }
                        downloadSuccess(pageInfo, page, retriesNum, data);
                    }
                });
            }
            // 下载不了就逝世备份
            async function downloadCompressedSpare(pageInfo, page, retriesNum) {
                let sparePageInfo = await pageInfo.loadSpare();
                // console.log(sparePageInfo);
                that.download.add({
                    url: sparePageInfo.url,
                    onerror: function (error) {
                        downloadFail(pageInfo, page, retriesNum, error);
                    },
                    onload: function (data, response) {
                        if (response.status != 200 || data.type.split("/")[0] != "image") {
                            downloadFail(pageInfo, page, retriesNum, new Error(`状态或类型错误`));
                        }
                        downloadSuccess(pageInfo, page, retriesNum, data);
                    }
                });
            }
            // 下载普通的
            function downloadCompressed(pageInfo, page, retriesNum) {
                that.download.add({
                    url: pageInfo.pic.url,
                    onerror: function (error) {
                        // console.warn("尝试备用路线", error);
                        downloadCompressedSpare(pageInfo, page, retriesNum);
                    },
                    onload: function (data, response) {
                        if (response.status != 200 || data.type.split("/")[0] != "image") {
                            // console.warn("尝试备用路线", error);
                            downloadCompressedSpare(pageInfo, page, retriesNum);
                        }
                        downloadSuccess(pageInfo, page, retriesNum, data);
                    }
                });
            }

            // 解析线程
            async function startParseProcess(id) {
                while (that.waitingQueue.length > 0) {
                    let [page, retriesNum] = that.waitingQueue.shift();
                    that.runningQueue[id] = [page, retriesNum];
                    let pageInfo;
                    try {
                        pageInfo = await that.ParseGallery.get(page);
                        that.parseProgress++;
                        that.onprogress(page, that);
                        if (pageInfo.is509) {
                            // 即访问次数过多,被判定为爬虫
                            retriesNum = 0;
                            throw new Error(`509 Error`);
                        }
                        // console.log(that.type, that.ParseGallery.gid, pageInfo);
                        let picCache = SQL.getPic({ fileIndex: pageInfo.pic.fileIndex, type: that.type });
                        if (picCache == null) {
                            if (that.type == "compressed") {
                                downloadCompressed(pageInfo, page, retriesNum);
                            }
                            if (that.type == "full") {
                                downloadFull(pageInfo, page, retriesNum);
                            }
                        } else {
                            downloadSuccess(pageInfo, page, retriesNum, await useCache("local", {name: picCache.cache_name}));
                        }
                    } catch (error) {
                        downloadFail(pageInfo, page, retriesNum, error);
                    } finally {
                        delete that.runningQueue[id];
                    };
                }
            }

            // 初始化
            await that.ParseGallery.init();

            SQL.addGallery(that.ParseGallery);

            if (that.ranges == "all") {
                that.ranges = [{ start: 1, end: that.ParseGallery.pages }];
            }

            for (let i in that.ranges) {
                for (let j = that.ranges[i].start; j <= that.ranges[i].end; j++) {
                    that.waitingQueue.push([j, that.retriesNum]);
                }
            }

            that.total = that.waitingQueue.length;

            for (let i = 0; i < that.parseProcessNum; i++) {
                startParseProcess(i);
            }
        });
    }
    getInfo() {
        let pages = [];
        for (let i in this.files.pages) {
            pages[i] = this.files.pages[i].pic;
        }

        let download = { waitingQueue: [], runningTasks: [], completeQueue: [] };
        for (let i in this.download.waitingQueue) {
            download.waitingQueue.push({
                url: this.download.waitingQueue[i].url.toString(),
                receivedLength: this.download.waitingQueue[i].receivedLength,
                contentLength: this.download.waitingQueue[i].contentLength
            });
        }

        for (let i in this.download.runningTasks) {
            download.runningTasks.push({
                url: this.download.runningTasks[i].url.toString(),
                receivedLength: this.download.runningTasks[i].receivedLength,
                contentLength: this.download.runningTasks[i].contentLength
            });
        }

        for (let i in this.download.completeQueue) {
            download.completeQueue.push({
                url: this.download.completeQueue[i].url.toString(),
                receivedLength: this.download.completeQueue[i].receivedLength,
                contentLength: this.download.completeQueue[i].contentLength
            });
        }

        return {
            download: download,
            url: this.url,
            ranges: this.ranges,
            parseProcessNum: this.parseProcessNum,
            downloadProcessNum: this.downloadProcessNum,
            retriesNum: this.retriesNum,
            type: this.type,
            parseProgress: this.parseProgress,
            downloadProgress: this.downloadProgress,
            waitingQueue: this.waitingQueue,
            runningQueue: this.runningQueue,
            errorQueue: this.errorQueue,
            completeQueue: this.completeQueue,
            pages: pages,
            gallery: SQL.getGalleryInfo(this.ParseGallery.gid)
        };
    }
}


class GalleryDownloadQueue {
    constructor(processNum = 1) {
        this.processNum = processNum;
        this.waitingQueue = [];
        this.runningQueue = [];
        this.completeQueue = [];
        this.idleProcess = [];
        for (let i = 0; i < processNum; i++) {
            this.idleProcess.push(i);
        }
    }
    getInfo() {
        let data = { waiting: [], running: [], complete: [], processNum: this.processNum };
        for (let i in this.waitingQueue) {
            data.waiting.push(this.waitingQueue[i].getInfo());
        }

        for (let i in this.runningQueue) {
            data.running.push(this.runningQueue[i].getInfo());
        }

        for (let i in this.completeQueue) {
            data.complete.push(this.completeQueue[i].getInfo());
        }
        return data;
    }
    async start() {
        if (this.idleProcess.length == 0 || this.waitingQueue.length == 0) {
            return;
        }
        let id = this.idleProcess.shift();
        this.runningQueue[id] = this.waitingQueue.shift();
        this.completeQueue.push(await this.runningQueue[id].start());
        delete this.runningQueue[id];
        this.idleProcess.push(id);
        this.start();
    }
    add(info) {
        if (info.constructor != GalleryDownload) {
            info = new GalleryDownload(info);
        }
        this.waitingQueue.push(info);
        this.start();
    }
}

// 数据库初始化
(async function () {
    let SQL = {};
    SQL.SQL = await initSqlJs({
        locateFile: () => "script/sql-wasm.wasm",
    });
    SQL.xesb = new SQL.SQL.Database();
    SQL.lastExecTime = 0;

    // 手打,不累,就是说vscode是真的智能
    SQL.addGallery = function (gallery) {
        if (!(gallery.constructor === api.ParseGallery)) {
            throw new Error("error 懒得写了");
        }
        // 添加画廊整体
        SQL.xesb.run("DELETE FROM gallerys WHERE gid = ?;", [gallery.gid]);
        SQL.xesb.run("INSERT INTO gallerys(url,mainName,secondaryName,cover,pages,categories,uploader,uploaderUrl,parent,parentUrl,language,isTranslation,postTime,visible,fileSize,favorited,favorites,torrentNum,rating,ragingCount,gid,token) VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);", [
            gallery.url.toString(),
            gallery.mainName,
            gallery.secondaryName,
            gallery.cover,
            gallery.pages,
            gallery.categories,
            gallery.uploader,
            gallery.uploaderUrl,
            gallery.parent,
            gallery.parentUrl,
            gallery.language,
            gallery.isTranslation,
            moment(gallery.postTime).format("yyyy-MM-DD HH:mm:ss"),
            gallery.visible,
            gallery.fileSize,
            gallery.favorited,
            gallery.favorites,
            gallery.torrentNum,
            gallery.rating,
            gallery.ragingCount,
            gallery.gid,
            gallery.token
        ]);

        // 添加标签
        SQL.xesb.run("DELETE FROM tags WHERE gid = ?;", [gallery.gid]);
        for (let categories in gallery.tags) {
            for (let i in gallery.tags[categories]) {
                SQL.xesb.run("INSERT INTO tags(gid,categories,credit,name,url) VALUES(?,?,?,?,?);", [
                    gallery.gid,
                    categories,
                    gallery.tags[categories][i].credit,
                    gallery.tags[categories][i].name,
                    gallery.tags[categories][i].url
                ]);
            }
        }

        // 添加评论
        SQL.xesb.run("DELETE FROM comments WHERE gid = ?;", [gallery.gid]);
        for (let i in gallery.comments) {
            SQL.xesb.run("INSERT INTO comments(gid,id,comments_index,score,postTime,type,uploder_name,uploder_url,content) VALUES(?,?,?,?,?,?,?,?,?);", [
                gallery.gid,
                gallery.comments[i].id,
                i,
                gallery.comments[i].score,
                moment(gallery.comments[i].postTime).format("yyyy-MM-DD HH:mm:ss"),
                gallery.comments[i].type,
                gallery.comments[i].uploder.name,
                gallery.comments[i].uploder.url,
                gallery.comments[i].content
            ]);
        }
        SQL.lastExecTime = Date.now();
        auto_sync();
    };

    SQL.getGalleryInfos = function ({ limit = 10, page = 1 } = {}) {
        limit = Math.abs(limit);
        page = Math.max(Math.abs(page), 1);
        let total = SQL.xesb.exec(`SELECT count(*) FROM gallerys;`)[0].values[0][0];
        let infos = SQL.xesb.exec(`SELECT * FROM gallerys ORDER BY reg_date DESC LIMIT ? OFFSET ?;`, [limit, (page - 1) * limit])[0];
        if (infos == undefined) {
            return [];
        }
        let gallerys = [];
        for (let i in infos.values) {
            let gallery = {};
            for (let j in infos.columns) {
                gallery[infos.columns[j]] = infos.values[i][j];
            }
            gallerys.push(gallery);
        }
        return {
            total: total,
            gallerys: gallerys
        };
    };

    SQL.getGalleryInfo = function (gid) {
        let info = SQL.xesb.exec(`SELECT * FROM gallerys WHERE gid = ?;`, [gid])[0];
        if (info == undefined) {
            return null;
        }
        let gallery = {};
        for (let i in info.columns) {
            gallery[info.columns[i]] = info.values[0][i];
        }
        gallery.tags = SQL.getGalleryTags(gid);
        gallery.comments = SQL.getGalleryComments(gid);
        return gallery;
    };

    SQL.getGalleryTags = function (gid) {
        let infos = SQL.xesb.exec(`SELECT categories,credit,name,url,reg_date FROM tags WHERE gid = ?;`, [gid])[0];
        if (infos == undefined) {
            return null;
        }
        let tags = {};
        for (let i in infos.values) {
            let tag = {};
            for (let j in infos.columns) {
                tag[infos.columns[j]] = infos.values[i][j];
            }
            if (!tags[tag.categories]) {
                tags[tag.categories] = [];
            }
            tags[tag.categories].push(tag);
        }
        return tags;
    };

    SQL.getGalleryComments = function (gid) {
        let infos = SQL.xesb.exec(`SELECT * FROM comments WHERE gid = ? ORDER BY comments_index ASC;`, [gid])[0];
        if (infos == undefined) {
            return null;
        }
        let comments = [];
        for (let i in infos.values) {
            let comment = {};
            for (let j in infos.columns) {
                comment[infos.columns[j]] = infos.values[i][j];
            }
            comments.push(comment);
        }
        return comments;
    };

    // start
    SQL.addPic = function (blob, type, gid, imgPage) {
        // 检测图片源文件是否缓存 pics table
        if (SQL.xesb.exec(`
        SELECT count(*)
        FROM pics
        WHERE
            fileIndex = ? AND
            type = ?;
        `, [imgPage.pic.fileIndex, type])[0]["values"][0][0] == 0) {
            // 插入
            let temparr = [
                imgPage.pic.fileIndex,
                imgPage.pic.name,
                type,
                blob.size,
            ];
            if (type == "compressed") {
                temparr.push(
                    imgPage.pic.height,
                    imgPage.pic.width
                );
            }
            if (type == "full") {
                temparr.push(
                    imgPage.pic.fullHeight,
                    imgPage.pic.fullWidth
                );
            }
            SQL.xesb.run("INSERT INTO pics(fileIndex,name,type,size,height,width) VALUES(?,?,?,?,?,?);", temparr);
        }

        // 获取id
        let id = SQL.xesb.exec(`
        SELECT id
        FROM pics
        WHERE
            fileIndex = ? AND
            type = ?;
        `, [imgPage.pic.fileIndex, type])[0]["values"][0][0];

        // 检测图片链接是否存在 relationships table
        if (SQL.xesb.exec(`
        SELECT count(*)
        FROM relationships
        WHERE
            gid = ? AND
            page = ?;
        `, [gid, imgPage.page])[0]["values"][0][0] == 0) {
            // 插入
            SQL.xesb.run("INSERT INTO relationships(pid,gid,page) VALUES(?,?,?);", [
                id,
                gid,
                imgPage.page
            ]);
        }

        // 创建/更新 缓存
        useCache("local", {name: "xesb_pic_" + id, value: blob});
        console.log("set cache", id, blob);
        // 自动同步数据库
        SQL.lastExecTime = Date.now();
        auto_sync();
        // 默认返回值
        return SQL.getPic({ id: id });
    };

    SQL.getPic = function ({ id, page, type, gid, fileIndex }) {
        let qStr = "";
        let qArr = [];

        if (id != undefined) {
            qStr += "pics.id = ? AND ";
            qArr.push(id);
        }
        if (page != undefined) {
            qStr += "relationships.page = ? AND ";
            qArr.push(page);
        }
        if (type != undefined) {
            qStr += "pics.type = ? AND ";
            qArr.push(type);
        }
        if (gid != undefined) {
            qStr += "relationships.gid = ? AND ";
            qArr.push(gid);
        }
        if (fileIndex != undefined) {
            qStr += "pics.fileIndex = ? AND ";
            qArr.push(fileIndex);
        }

        if (qStr == "") {
            throw new Error("");
        }

        qStr = qStr.substring(0, qStr.length - 5);

        // console.log(qArr, qStr);

        // 连结表
        let infos = SQL.xesb.exec(`
        SELECT
            pics.id,
            relationships.gid,
            pics.fileIndex,
            pics.name,
            relationships.page,
            pics.type,
            pics.size,
            pics.height,
            pics.width,
            relationships.reg_date
        FROM
            pics,
            relationships
        WHERE relationships.pid = pics.id AND ${qStr};`, qArr)[0];
        if (infos == undefined) {
            return null;
        }
        let pic = {};
        for (let i in infos.columns) {
            pic[infos.columns[i]] = infos.values[0][i];
        }
        console.log("read cache", pic.id);
        pic.cache_name = "xesb_pic_" + pic.id;
        return pic;
    };

    SQL.getPics = function (gid) {
        let infos = SQL.xesb.exec(`
        SELECT
            pics.id,
            relationships.gid,
            pics.fileIndex,
            pics.name,
            relationships.page,
            pics.type,
            pics.size,
            pics.height,
            pics.width,
            relationships.reg_date
        FROM
            pics,
            relationships
        WHERE
            relationships.pid = pics.id AND
            relationships.gid = ?
        ORDER BY
            page ASC;`, [gid])[0];
        if (infos == undefined) {
            return [];
        }
        let pics = [];
        for (let i in infos.values) {
            let pic = {};
            for (let j in infos.columns) {
                pic[infos.columns[j]] = infos.values[i][j];
            }
            pic.cache_name = "xesb_pic_" + pic.id;
            pics.push(pic);
        }
        return pics;
    };

    SQL.getCover = function (gid) {
        let infos = SQL.xesb.exec(`
        SELECT
            pics.id,
            relationships.gid,
            pics.fileIndex,
            pics.name,
            relationships.page,
            pics.type,
            pics.size,
            pics.height,
            pics.width,
            relationships.reg_date
        FROM
            pics,
            relationships
        WHERE
            relationships.pid = pics.id AND
            relationships.gid = ?
        ORDER BY
            page ASC
        LIMIT 1
        OFFSET 0;`, [gid])[0];
        if (infos == undefined) {
            return null;
        }
        let pic = {};
        for (let i in infos.columns) {
            pic[infos.columns[i]] = infos.values[0][i];
        }
        pic.cache_name = "xesb_pic_" + pic.id;
        return pic;
    };
    // end

    let timerId;
    function auto_sync() {
        if (timerId) {
            clearTimeout(timerId);
        }
        timerId = setTimeout(SQL.sync, 3000);
    }

    let syncing = false;
    SQL.sync = async function () {
        if (syncing) {
            return;
        }
        syncing = true;
        if (SQL.lastExecTime >= (await useCache("local", {name: "xesb_database_lastExecTime"}) || -1)) {
            await useCache("local", {name: "xesb_database_lastExecTime", value: SQL.lastExecTime});
            await useCache("local", {name: "xesb_database", value: SQL.xesb.export()});
        } else {
            SQL.xesb = new SQL.SQL.Database(await useCache("local", {name: "xesb_database"}));
        }
        syncing = false;
    }


    SQL.xesb.run(await fetch(chrome.runtime.getURL("xesb.sql")).then(res => res.text()));

    await SQL.sync();

    globalThis.SQL = SQL;
})();

let api = new XESB();

let startTimestramp = moment().valueOf();

let backgroundDownloadQueue = new GalleryDownloadQueue();

let typeToFunction = {
    "getStartTimestramp": function () {
        return startTimestramp;
    },
    "downloadGallery": function (request) {
        backgroundDownloadQueue.add({
            url: request.url,
            onprogress: function () { console.log("progress", arguments) },
            onload: function () { console.log("load", arguments) },
            onerror: function () { console.log("error", arguments) },
            downloadProcessNum: 3
        });
        return {
            state: "success"
        };
    },
    "getDownloadInfo": function () {
        return backgroundDownloadQueue.getInfo();
    },
    "getGalleryInfos": function (request) {
        return SQL.getGalleryInfos(request.data);
    },
    "getGalleryInfo": function (request) {
        return SQL.getGalleryInfo(request.gid);
    },
    "getGalleryTags": function (request) {
        return SQL.getGalleryTags(request.gid);
    },
    "getGalleryComments": function (request) {
        return SQL.getGalleryComments(request.gid);
    },
    "getPic": function (request) {
        return SQL.getPic(request.data);
    },
    "getPics": function (request) {
        return SQL.getPics(request.gid);
    },
    "getCover": function (request) {
        return SQL.getCover(request.gid);
    }
};

chrome.runtime.onMessage.addListener(async function (request, sender, sendResponse) {
    sendResponse(await typeToFunction[request.type](request, sender));
});