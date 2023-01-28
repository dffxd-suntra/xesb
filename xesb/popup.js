async function updateDownloadQueue() {
    function generateTabelPair(x, y) {
        return $(`<tr></tr>`).append(
            $(`<th style="word-break:keep-all;white-space:nowrap;"></th>`).text(x),
            $(`<td></td>`).text(y)
        );
    }
    function generateList(info) {
        return $(`<li></li>`).append(
            $(`<table></table>`).append(
                generateTabelPair("名称:", info.gallery.mainName),
                generateTabelPair("下载进度:", info.downloadProgress),
                generateTabelPair("解析进度:", info.parseProgress),
                generateTabelPair("错误个数:", info.errorQueue.length),
                generateTabelPair("页数:", info.gallery.pages)
            ),
            $(`<ol></ol>`).append(
                info.download.runningTasks.map(function (info) {
                    return $(`<li></li>`).append(
                        $(`<table></table>`).append(
                            generateTabelPair("链接:", info.url),
                            generateTabelPair("进度:", ((info.receivedLength * 100 / info.contentLength) || 0).toFixed(2) + "%"),
                            generateTabelPair("下载大小:", formatSize(info.receivedLength)),
                            generateTabelPair("总大小:", formatSize(info.contentLength))
                        ),
                    );
                })
            )
        );
    }
    let response = await sendMessage({ type: "getDownloadInfo" });
    $("#waitingQueueInfo").html(response.waiting.map(generateList));
    $("#runningQueueInfo").html(response.running.map(generateList));
    $("#completeQueueInfo").html(response.complete.map(generateList));
}

async function init() {
    let page = await getCurrentTab();

    let api = new XESB();

    let url = new URL(page.url);

    let pageType = api.getPageType(url);

    // 初始化切换标签页
    $("#tabLabels > .item").tab();

    if (pageType == 15) {
        // 当前是画廊界面
        $("#downloadThisGallery").click(async function () {
            let response = await sendMessage({
                type: "downloadGallery",
                url: page.url
            });
            if (response.state == "success") {
                $("#downloadThisGallery").text("下载本画廊-已添加");
            } else {
                $("#downloadThisGallery").text("下载本画廊-" + response.msg);
            }
        });
    } else {
        // 当前不是画廊界面
        $("#downloadThisGallery").css("cursor", "not-allowed");
        $("#downloadThisGallery").click(function () {
            $("#downloadThisGallery").text("此页面不是画廊页面");
            setTimeout(function () { $("#downloadThisGallery").text("下载本画廊"); }, 500);
        });
    }

    // 实时更新后台运行时间
    let backgroundStartTimestramp = await sendMessage({
        type: "getStartTimestramp"
    });
    $("#formatedStartTimestramp").text("后台运行时间: " + moment(backgroundStartTimestramp).fromNow(true));
    setInterval(async function () {
        $("#formatedStartTimestramp").text("后台运行时间: " + moment(backgroundStartTimestramp).fromNow(true));
    }, 10000);


    $("#downloadQueueItems > .item").tab();
    // 实时更新队列
    updateDownloadQueue();
    setInterval(updateDownloadQueue, 500);
}

init();