/**
 * 来到这里的开发者我跟你讲,不要搞什么sql注入什么的,程序都是前端运行
 */
// 加载js
importScripts("lodash.min.js"); 
importScripts("sqljs/sql-wasm.js"); 
importScripts("localforage.min.js");
importScripts("uuid.min.js");
importScripts("moment.min.js");
importScripts("moment.zh-CN.js");
importScripts("vwd.js");

// 为了存储的方便,我决定将数组翻译成字符串
function Uint8ArrayToString(fileData) {
    var dataString = "";
    for (var i = 0; i < fileData.length; i++) {
        dataString += String.fromCharCode(fileData[i]);
    }
    return dataString;
}
function StringToUint8Array(str) {
    var arr = [];
    for (var i = 0, j = str.length; i < j; ++i) {
        arr.push(str.charCodeAt(i));
    }
    var tmpUint8Array = new Uint8Array(arr);
    return tmpUint8Array;
}

// 数据库的 object
let sql = {
    db: {},
    inited: false,
    lastExecTime: -1,
    init: async function () {
        console.log("数据库开始加载");
        if(sql.inited) {
            return sql.SQL;
        }
        let SQL = await initSqlJs({
            locateFile: () => "sqljs/sql-wasm.wasm",
        });
        let booru = new SQL.Database();
        // 创建一个拥有全部键的表
        booru.run("CREATE TABLE infos (id, created_at, uploader_id, score, source, md5, last_comment_bumped_at, rating, image_width, image_height, tag_string, fav_count, file_ext, last_noted_at, parent_id, has_children, approver_id, tag_count_general, tag_count_artist, tag_count_character, tag_count_copyright, file_size, up_score, down_score, is_pending, is_flagged, is_deleted, tag_count, updated_at, is_banned, pixiv_id, last_commented_at, has_active_children, bit_flags, tag_count_meta, has_large, has_visible_children, tag_string_general, tag_string_character, tag_string_copyright, tag_string_artist, tag_string_meta, file_url, large_file_url, preview_file_url);");
        sql.SQL = SQL;
        sql.db.booru = booru;
        await sql.sync();
        sql.inited = true;
        clearTaskQueue();
        console.log("数据库加载完成");
        return SQL;
    },
    getInfo: function (option = null) {
        if(!sql.inited) {
            return false;
        }
        if(option == null) {
            return [];
        }
        let q = "", v = [];
        if(option == "all") {
            q = "SELECT * FROM infos ORDER BY id";
        } else {
            q = "SELECT * FROM infos WHERE ";
            for(let k in option) {
                q += k + " = ? AND ";
                v.push(option[k]);
            }
            q = q.substring(0, q.length-5);
            q += " ORDER BY id";
        }
        let rt = sql.db.booru.exec(q, v);
        if(rt.length == 0) {
            return [];
        }
        let infos = [];
        for(let i in rt[0]["values"]) {
            infos.push(_.zipObject(rt[0][["columns"]], rt[0]["values"][i]));
        }
        return infos;
    },
    addInfo: function (info) {
        if(!sql.inited) {
            return false;
        }
        // id为唯一标识
        if(sql.db.booru.exec("SELECT count(*) AS num FROM infos WHERE id = "+info.id)[0]["values"][0][0]!=0) {
            sql.db.booru.run("DELETE FROM infos WHERE id = "+info.id);
        }
        // 预处理语句,防背刺
        let keys = Object.keys(info),
            values = Object.values(info);
        let p = "?,".repeat(keys.length);
        p = p.substring(0,p.length-1);
        sql.db.booru.run("INSERT INTO infos("+keys.join(",")+") VALUES("+p+")", values);
        sql.lastExecTime = moment().valueOf();
        startSync();
        return true;
    },
    export: function(dbname) {
        return Uint8ArrayToString(sql.db[dbname].export());
    },
    import: function(dbname, t) {
        if(_.isString(t)) {
            t = StringToUint8Array(t);
        }
        if(!_.isTypedArray(t)) {
            return false;
        }
        sql.db[dbname] = new sql.SQL.Database(t);
        return true;
    },
    sync: async function () {
        // 多线程就看命
        // 多进程怎么样都不会出事
        console.log("开始同步");
        for(let dbname in sql.db) {
            let temp1 = baseName+"-"+dbname+"-lastExecTime";
            let temp2 = baseName+"-"+dbname+"-sqlData";
            // 1. 检测是否初始化
            // 2. 检测最后运行时间
            let tc1 = await localforage.getItem(temp1);
            if(tc1 == null||sql.lastExecTime > tc1) {
                console.log("存储数据库", dbname);
                await Promise.all([
                    localforage.setItem(temp1, sql.lastExecTime),
                    localforage.setItem(temp2, sql.export(dbname))
                ]);
                console.log("数据库", dbname, "存储成功");
            }
            if(sql.lastExecTime < tc1) {
                console.log("导入数据库", dbname);
                let tc2 = await localforage.getItem(temp2);
                sql.import(dbname, tc2);
                console.log("数据库", dbname, "导入成功");
            }
        }
        console.log("同步完成");
        return true;
    },
};

let openIndex = {
    sql: sql
};
// 基本名,需保持与index.php中的一致,以后会优化成php配置文件
let baseName = "booru";
let syncTimerId = null, 
    syncTime = 1500,
    onsync = false;
function startSync() {
    // 不能同时进行两个数据库同步
    if(onsync) {
        return;
    }
    // 要求是在 syncTime 毫秒内没有任务运行才同步数据库(空闲时间)
    // 所以有一个定时器,每当有任务运行就重置定时器,让他从新走 syncTime 毫秒
    if(syncTimerId!=null) {
        clearTimeout(syncTimerId);
    }
    // 定时器
    syncTimerId = setTimeout(function() {
        onsync = true;
        sql.sync().then(function () {
            onsync = false;
        });
    }, syncTime);
}
// 返回数据
function returnData(portId, uuid, data) {
    // uuid: 为客户端随机生成的唯一的任务编号,怎么样来,怎么样还回去
    // data: 运行后返回的数据
    savePorts[portId].postMessage({
        uuid: uuid,
        data: data
    });
}
function getValueByIndex(obj, index) {
    for(let i in index) {
        obj = obj[index[i]];
    }
    return obj;
}
// 运行任务
async function runTask(portId, uuid, name, data) {
    // 否则运行+返回数据
    // 无论是否为promise,统统await
    returnData(portId, uuid, await getValueByIndex(openIndex, _.toPath(name)).apply(null, data));
}
// 有一个队列功能是避免数据库未初始化完成
let taskQueue = [];
function clearTaskQueue() {
    while(taskQueue.length>0) {
        // 获取数据
        data = taskQueue.shift();
        portId = data.portId;
        data = data.data;
        // 运行任务
        runTask(portId, data.uuid, data.name, data.data);
    }
}
// 接收数据
function receiveData(portId, data) {
    // 是否初始化完成,否就存到队列里
    if(sql.inited) {
        // 重要!先清空队列再运行!
        clearTaskQueue();
        // 运行任务
        runTask(portId, data.uuid, data.name, data.data);
    } else {
        taskQueue.push({
            "portId": portId,
            "data": data
        });
    }
}
// 不用管页面退出,不影响性能
let savePorts = [];
function addPort(port) {
    // 分配id
    let portId = savePorts.length;
    // 存储端口
    savePorts.push(port);
    port.onmessage = function(e) {
        // 接收数据
        receiveData(portId, e.data);
    };
    // 开启端口
    port.start();
}

// ===== 程序开始 =====
// 接受连接请求
this.onconnect = function(e) {
    // 添加端口
    addPort(e.ports[0]);
}

sql.init();