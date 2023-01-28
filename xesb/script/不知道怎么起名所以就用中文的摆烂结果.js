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

async function useCache(name, value) {
    // 处理文件名的特殊格式
    if (name.constructor === Object) {
        // 最稳定的排序啊啊啊啊
        let keys = Object.keys(name);
        for (let i = 0; i < keys.length - 1; i++) {
            for (let j = i + 1; j < keys.length; j++) {
                if (keys[i] > keys[j]) {
                    let temp;

                    temp = keys[i];
                    keys[i] = keys[j];
                    keys[j] = temp;

                    temp = name[i];
                    name[i] = name[j];
                    name[j] = temp;
                }
            }
        }

        name = JSON.stringify(name);
    }
    if (name.constructor === Array) {
        name = name.sort();
        name = JSON.stringify(name);
    }
    name = name.toString();

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

    // 处理值的特殊格式
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
}

async function objectToStorage() {
}