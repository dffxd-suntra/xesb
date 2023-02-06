function getCurrentTab() {
    return new Promise(function (resolve, reject) {
        chrome.tabs.query({ active: true, lastFocusedWindow: true }, function ([page]) { resolve(page) });
    });
}

function sendMessage(request) {
    return new Promise(function (resolve, reject) {
        chrome.runtime.sendMessage(request, function (response) { resolve(response) });
    });
}

function formatSize(byte, precision = 2) {
    let unit = {
        "PB": 1125899906842600,
        "TB": 1099511627776,
        "GB": 1073741824,
        "MB": 1048576,
        "KB": 1024,
        "BYTE": 1,
    };
    for (let i in unit) {
        if (byte / unit[i] >= 1) {
            return (byte / unit[i]).toFixed(precision) + " " + i;
        }
    }
}

// auto为是否自动处理文件名和格式
async function useCache(name, value, auto = true) {
    // 文件名为object
    if (name.constructor === Object) {
        // 自动排序,并且
        let keys = Object.keys(name);
        let newName = [];

        keys.sort();

        for (let i in keys) {
            newName.push([
                i,
                keys[i]
            ]);
        }

        name = newName;
    }

    // 文件名为数组
    if (name.constructor === Array) {
        name = JSON.stringify(name);
    }

    // 其他格式,例如 Number 也要稍微处理
    name = name.toString();

    // 如果值是空的,那么就是获取这个键下的值
    if (value === undefined) {
        let data, value;
        data = await new Promise(function (resolve, reject) {
            chrome.storage.local.get(name, function (v) {
                resolve(v[name]);
            });
        });

        if (data == undefined) {
            return null;
        }
        [data, value] = data;

        if (data.type == "ori") {
            return value;
        }
        if (data.type == "Uint8Array" || data.type == "ArrayBuffer" || data.type == "Blob") {
            let arr = [];
            for (let i = 0; i < value.length; i++) {
                arr[i] = value.charCodeAt(i);
            }
            value = new Uint8Array(arr);
        }
        if (data.type == "ArrayBuffer" || data.type == "Blob") {
            value = value.buffer;
        }
        if (data.type == "Blob") {
            value = new Blob([value], {
                type: data.mime
            });
        }
        return value;
    }

    // data: 附加的数据,例如数据类型等等
    let data = {};
    if (value.constructor === Blob) {
        data.mime = value.type;
        value = await value.arrayBuffer();
        data.type = "Blob";
    }
    if (value.constructor === ArrayBuffer) {
        value = new Uint8Array(value);
        data.type = data.type || "ArrayBuffer";
    }
    if (value.constructor === Uint8Array) {
        let str = "";
        for (let i = 0; i < value.length; i++) {
            str += String.fromCharCode(value[i]);
        }
        value = str;
        data.type = data.type || "Uint8Array";
    }
    data.type = data.type || "ori";

    let obj = {};
    obj[name] = [data, value];
    // console.log(obj);
    return await new Promise(function (resolve, reject) {
        chrome.storage.local.set(obj, function () {
            resolve();
        });
    });
}

async function storageToObject() {
    let obj = {};

    SQL.sync();
    obj["xesb_database_lastExecTime"] = await useCache("xesb_database_lastExecTime");
    obj["xesb_database"] = await useCache("xesb_database");

    let pics = SQL.xesb.exec("SELECT id FROM pics;")[0]["values"];
    for (let i in pics) {
        let id = pics[i][0];
        let name = "xesb_pic_" + id;
        obj[name] = await new Promise(function (resolve, reject) {
            chrome.storage.local.get(name, function (v) {
                resolve(v[name]);
            });
        });
    }

    return obj;
}

async function objectToStorage(obj) {
    for (let i in obj) {
        await useCache(i, obj[i]);
    }

    SQL.sync();
}

(function () {
    if (!keyboardJS) {
        return;
    }

    let controller = [];

    keyboardJS.pressInSeq = function (keys, func, delay = 1000) {
        let id = controller.length;
        let count = 0;
        let timerId = null;
        let cancel = function () {
            if (timerId != null) {
                clearTimeout(timerId);
                timerId = null;
            }
            keyboardJS.unbind(keys[count], next);
        };
        let reStart = function () {
            cancel();
            count = 0;
            keyboardJS.bind(keys[count], next);
        };
        let next = function () {
            if (timerId != null) {
                clearTimeout(timerId);
            }
            keyboardJS.unbind(keys[count], next);
            count++;
            if (count == keys.length) {
                func();
                reStart();
            } else {
                keyboardJS.bind(keys[count], next);
                timerId = setTimeout(reStart, delay);
            }
        };
        keyboardJS.bind(keys[count], next);
        controller.push(cancel);
        return id;
    };

    keyboardJS.cancelPressInSeq = function (id) {
        controller[id]();
    };
})();

keyboardJS.pressInSeq(["up", "up", "down", "down", "left", "right", "left", "right", ["b", "B"], ["a", "A"], ["b", "B"], ["a", "A"]], function () {
    alert("彩蛋未施工!");
});