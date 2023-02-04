const downloadFiles = (function () {
    return function ({ processNum = 5 }) {
        class downloader {
            constructor({ url, onload, onprogress, onerror, type = "blob", timeout = 60000 }) {
                if (!url) {
                    throw new Error(`链接有误: "${url}"`);
                }
                this.url = new URL(url);
                this.onload = onload || function () { };
                this.onprogress = onprogress || function () { };
                this.onerror = onerror || function () { };
                this.type = type.toLowerCase();
                this.timeout = timeout;
            }
            async start() {
                let that = this;
                // 很艹啊,要获取下载进度就要自己写这些,tnnd太不方便了,谷歌就非得禁xhr
                // 四种情况
                // 1. 压缩 false,长度 true 
                // 2. 压缩 true, 长度 true 
                // 3. 压缩 false,长度 false
                // 4. 压缩 true, 长度 false
                // 第四种最难办,简直就是...!因此,我只考虑第一种,反正只是下载图片,其实还有一种方法,就是套代理,代理过后只要他们自己获取,我也就能获取到,以后再说,现在没有这种功能
                // 初始化超时 套一层函数避免污染this
                setTimeout(function () { that.abort(); }, this.timeout);
                // 初始化取消器
                this.controller = new AbortController();
                // 获取
                let response = await fetch(this.url.toString(), { signal: this.controller.signal });
                this.response = response;
                // 阅读器
                let reader = response.body.getReader();
                // mime
                let [mime = "application/octet-stream", encode = "utf-8"] = response.headers.get("content-type").split(";");
                encode = encode.replace(/charset *= */g, "");

                // 总大小
                let contentLength = parseInt(response.headers.get('Content-Length'));
                // 接收的大小
                let receivedLength = 0;
                // 长度是否可计算
                let lengthComputable = this.lengthComputable = (response.headers.get("content-encoding") || "").match(/(gzip|compress|deflate|br)/g) == null;
                // 接收的数据
                let chunks = [];

                // console.log(receivedLength, contentLength, lengthComputable, mime, encode, response);

                // 先给一个 0% 的
                this.receivedLength = receivedLength;
                this.contentLength = contentLength;
                this.onprogress(receivedLength, contentLength, lengthComputable, response);

                await new Promise(function (resolve, reject) {
                    async function processingData() {
                        // 读取
                        let { done, value } = await reader.read().catch(function (error) {
                            reject(error);
                        });
                        // 检测是否完成
                        if (done) {
                            // 结束计时
                            clearInterval(that.timerId);
                            resolve();
                            return;
                        }
                        chunks.push(value);
                        // 将长度加上
                        receivedLength += value.length;
                        // 反馈进度
                        that.receivedLength = receivedLength;
                        that.contentLength = contentLength;
                        that.onprogress(receivedLength, contentLength, lengthComputable, response);
                    }
                    // 200ms汇报一次
                    that.timerId = setInterval(processingData, 200);
                });

                let u8 = new Uint8Array(receivedLength);
                let position = 0;
                for (let chunk of chunks) {
                    u8.set(chunk, position);
                    position += chunk.length;
                }

                let data;
                switch (this.type) {
                    case "uint8array":
                        data = u8;
                        break;
                    case "text":
                        data = new TextDecoder(encode).decode(u8);
                        break;
                    case "arrayBuffer":
                        data = u8.buffer;
                        break;
                    case "blob":
                        data = new Blob([u8.buffer], {
                            type: mime
                        });
                        break;
                }

                // 加载完成返回数据
                this.onload(data, response);
            }
            abort() {
                if (this.timerId != undefined) {
                    clearTimeout(this.timerId);
                }
                this.controller.abort();
                throw new Error(`Abort`);
            }
        }
        this.downloader = downloader;

        async function startNewProsess(id, task) {
            runningTasks[id] = task;
            try {
                await runningTasks[id].start();
            } catch (error) {
                clearInterval(runningTasks[id].timerId);
                runningTasks[id].onerror(error);
                console.warn(error);
            } finally {
                completeQueue.push(runningTasks[id]);
                delete runningTasks[id];
                idleProcess.push(id);
                checkQueue();
            };
        }

        async function checkQueue() {
            while (idleProcess.length != 0 && waitingQueue.length != 0) {
                let id = idleProcess.shift();
                let task = waitingQueue.shift();
                startNewProsess(id, task);
            }
        }
        this.checkQueue = checkQueue;

        function add(options) {
            waitingQueue.push(new downloader(options));
            checkQueue();
        }
        this.add = add;

        let waitingQueue = [];
        this.waitingQueue = waitingQueue;

        let runningTasks = [];
        this.runningTasks = runningTasks;

        let completeQueue = [];
        this.completeQueue = completeQueue;

        let idleProcess = [];
        this.idleProcess = idleProcess;
        this.processNum = processNum;
        for (let i = 0; i < processNum; i++) {
            idleProcess.push(i);
        }
    };
})();