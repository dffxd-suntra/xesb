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
                this.controller = new AbortController();
                axios.get(this.url.toString(), {
                    responseType: this.type,
                    timeout: this.timeout,
                    onDownloadProgress: function (progressEvent) {
                        that.receivedLength = progressEvent.loaded;
                        that.contentLength = progressEvent.total;
                        that.lengthComputable = progressEvent.event.lengthComputable;
                        that.onprogress(that.receivedLength, that.contentLength, that.lengthComputable, this, that);
                    },
                    signal: this.controller.signal
                })
                    .then(function (response) {
                        // 加载完成返回数据
                        that.onload(response.data, response);
                    })
                    .catch(function (error) {
                        that.onerror(error);
                    });
            }
            abort() {
                this.controller.abort();
            }
        }
        this.downloader = downloader;

        async function startNewProsess(id, task) {
            runningTasks[id] = task;
            await runningTasks[id].start();
            completeQueue.push(runningTasks[id]);
            delete runningTasks[id];
            idleProcess.push(id);
            checkQueue();
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