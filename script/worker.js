/**
 * 来到这里的开发者我跟你讲,不要搞什么sql注入什么的,程序都是前端运行
 */
// 加载js
importScripts("https://cdn.jsdelivr.net/gh/dffxd-suntra/xesb@main/script/vwd.min.js");
importScripts("https://cdn.jsdelivr.net/npm/lodash@4.17.21/lodash.min.js"); 
importScripts("https://cdn.jsdelivr.net/npm/uuidjs@4.2.12/src/uuid.min.js");
// 返回数据
function returnData(portId, uuid, data) {
    // uuid: 为客户端随机生成的唯一的任务编号,怎么样来,怎么样还回去
    // data: 运行后返回的数据
    savePorts[portId].postMessage({
        uuid: uuid,
        data: data
    });
}
// 运行任务
async function runTask(portId, uuid, func, data) {
    // 否则运行+返回数据
    // 无论是否为promise,统统await
    returnData(portId, uuid, await func.apply(window, data));
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
        runTask(portId, data.uuid, data.func, data.data);
    }
}
// 接收数据
function receiveData(portId, data) {
    // 是否初始化完成,否就存到队列里
    if(sql.inited) {
        // 重要!先清空队列再运行!
        clearTaskQueue();
        // 运行任务
        runTask(portId, data.uuid, data.func, data.data);
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