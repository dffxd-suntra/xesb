// ==UserScript==
// @name         xesb
// @author       Suntra
// @version      0.5
// @namespace    https://github.com/dffxd-suntra/xesb
// @description  exhentai/e-hentai 油猴插件,可以批量爬取图片,并且开发了预览功能
// @homepage     https://github.com/dffxd-suntra/xesb
// @match        https://exhentai.org/*
// @match        https://e-hentai.org/*
// @require      https://cdn.jsdelivr.net/npm/jquery@3.2.1/dist/jquery.min.js
// @require      https://cdn.jsdelivr.net/npm/jszip@3.7.1/dist/jszip.min.js
// @require      https://cdn.bootcdn.net/ajax/libs/FileSaver.js/2.0.5/FileSaver.min.js
// @grant        GM_xmlhttpRequest
// @grant        GM_download
// @run-at       document-idle
// ==/UserScript==

// main
(function () {
    let i18n = {
        "zh-CN": {
        },
        "en": {
            "清空":"clear",
            "反选":"Inverse",
            "开始下载":"strat download",
            "长条预览":"preview",
            "xesb面板":"xesb panel",
            "打开xesb面板":"open xesb panel",
            "关闭":"close",
            "高度":"height",
            "速度":"speed",
            "开始滚动":"start rolling",
            "停止滚动":"stop rolling",
            "全屏":"full screen",
            "返回顶部":"to top",
            "名称":"name",
            "复名称":"secend name",
            "页数":"pages",
            "下载图片进度":"progress",
            "大小":"size",
            "状态":"state",
            "刷新列表":"Refresh table",
            "输出测试数据":"comic data output",
        }
    }
    /* let regList = [
        /^\/$/,
        /^\/g\/[^\/]+\/[^\/]+\/$/,
    ];

    function getPage() {
        for (let key in regList) {
            if (regList[key].test(pathName)) {
                return key;
            }
        }
        return -1;
    } */

    let comicInfo = [];
    // 存zipobject
    let zipList = [];
    function getComicInfo(url) {
        let name, secname, page;
        $.ajax({
            async: false,
            url: url,
            success: function (result, status, xhr) {
                let html = $("<div></div>");
                html.html(result);
                name = $("#gn",html).text();
                secname = $("#gj",html).text();
                page = Number($("#gdd > table > tbody > tr:nth-child(6) > td.gdt2",html).text().split(" ")[0]);
            }
        });
        return {
            url: url,
            name: name,
            secname: secname,
            page: page,
            size: 0,
            pageInfo: [],
            progress: 0,
            state: ""
        };
    }
    function size_format(bytes, precision = 2){
        if (bytes == 0) return "0 B";
        let unit = {
            'TB': 1099511627776,
            'GB': 1073741824,
            'MB': 1048576,
            'kB': 1024,
            'B ': 1,
        };
        for(let un in unit) {
            if (bytes >= unit[un]) {
                return (bytes / unit[un]).toFixed(precision)+' '+un;
            }
        }
    }
    function display() {
        new Promise((resolve, reject) => {
            $("#xesb_displayBox").html("");
            comicInfo.map(function (comic) {
                $("#xesb_displayBox").html($("#xesb_displayBox").html()+`<tr>
                    <td>`+comic.name+`</td><td>`+comic.secname+`</td><td>`+comic.page+`</td><td>`+comic.progress+`/`+comic.page+`</td><td>`+size_format(comic.size)+`</td><td>`+comic.state+`</td>
                </tr>`);
                resolve(comic);
            });
        });
    }
    function download(id,imgSet) {
        console.log(comicInfo[id].name,"开始下载!");
        comicInfo[id].state = "下载中";
        let pageNow;
        $.ajax({
            async: false,
            url: comicInfo[id].url,
            success: function (result, status, xhr) {
                let html = $("<div></div>");
                html.html(result);
                pageNow = $("#gdt > div:nth-child(1) > a",html).attr("href") || $("#gdt > div:nth-child(1) > div > a",html).attr("href");
            }
        });

        let promiseList = [];
        for(let i=1;i<=comicInfo[id].page;i++){
            promiseList.push(new Promise((bigresolve, bigreject) => {
                let picUrl, picName, pageUrl;
                pageUrl = pageNow;
                $.ajax({
                    async: false,
                    url: pageUrl,
                    success: function (result, status, xhr) {
                        let html = $("<div></div>");
                        html.html(result);
                        picUrl = $("#img",html).attr("src");
                        picName = picUrl.split("/").pop();
                        pageNow = $("#i3 > a",html).attr("href");
                    }
                });
                GM_xmlhttpRequest({
                    method: "GET",
                    url: picUrl,
                    responseType: "blob",
                    onload: function (response) {
                        imgSet.file(picName, response.response, {
                            "blob": true
                        });
                        comicInfo[id].progress++;
                        comicInfo[id].pageInfo.push({
                            picUrl: picUrl,
                            picName: picName,
                            pageUrl: pageUrl,
                            size: response.response.size
                        });
                        comicInfo[id].size+=response.response.size;
                        console.log(comicInfo[id].name,picName,"下载成功!",comicInfo[id].progress,"/",comicInfo[id].page);
                        display();
                        bigresolve(response.response);
                    }
                });
            }));
        }
        Promise.all(promiseList).then(function () {
            imgSet.file("config.json",JSON.stringify(comicInfo[id]));
            console.log(comicInfo[id].name,"正在打为zip文件");
            zipList[id].generateAsync({
                type: "blob"
            }).then(function (blob) {
                saveAs(blob, comicInfo[id].name + ".zip");
                console.log(comicInfo[id].name,"下载成功!");
            });
        });
    }
    function addComic(url) {
        // 这两个数组的项目数应相同
        for(let i=0;i<comicInfo.length;i++) {
            if(comicInfo[i].url==url) {
                return -1;
            }
        }
        comicInfo.push(getComicInfo(url));
        zipList.push(new JSZip());
        let id = comicInfo.length-1;
        let imgSet = zipList[id].folder(comicInfo[id].name);
        display();
        download(id,imgSet);
        comicInfo[id].state = "完成";
    }
    let viewPageWidth = 80;
    function changeWidth(x) {
        viewPageWidth = Math.max(viewPageWidth+x,1);
        // 调整大小可能会错位,所以算比例修复错位
        let vwHt = $("#xesb_viewPage").outerHeight(true),
            vwTop = $("#xesb_previewBox").scrollTop();

        $("#xesb_viewPage").css("width",viewPageWidth+"%");
        $("#xesb_showWidth").text(viewPageWidth+"%");

        $("#xesb_previewBox").scrollTop(
            vwTop*($("#xesb_viewPage").outerHeight(true) / vwHt)
        );
    }
    function preview(url) {
        $("#xesb_viewPage").html("");
        let pageNow, page, autoPage=0;
        $.ajax({
            async: false,
            url: url,
            success: function (result, status, xhr) {
                let html = $("<div></div>");
                html.html(result);
                pageNow = $("#gdt > div:nth-child(1) > a",html).attr("href") || $("#gdt > div:nth-child(1) > div > a",html).attr("href");
                page = Number($("#gdd > table > tbody > tr:nth-child(6) > td.gdt2",html).text().split(" ")[0]);
                console.log(pageNow,page);
            }
        });
        function loadPage() {
            if($("#xesb_previewBox").prop("scrollHeight")-$(window).height()-$("#xesb_previewBox").scrollTop()<=$(window).height()&&autoPage<page) {
                let times = 2;
                while(times--) {
                    new Promise((resolve, reject) => {
                        $.ajax({
                            async: false,
                            url: pageNow,
                            success: function (result, status, xhr) {
                                let html = $("<div></div>");
                                html.html(result);
                                let picUrl = $("#img",html).attr("src");
                                $("#xesb_viewPage").append(`
                                <li>
                                    <img src="`+picUrl+`" style="width:100%;list-style:none;margin:0;padding:0;">
                                </li>`);
                                pageNow = $("#i3 > a",html).attr("href");
                                resolve(picUrl);
                            }
                        });
                    });
                    autoPage++;
                    if(autoPage==page) {
                        break;
                    }
                }
            }
        }
        loadPage();
        $("#xesb_previewBox").scroll(loadPage);
        $("#xesb_previewBox").click(loadPage);
    }

    /* let pathName = location.pathname;
    let page = getPage();
    console.log(page);
    if (page == -1) {
        return;
    } */
    $("head").append(`<meta name="viewport" content="width=device-width, initial-scale=1.0">`);
    $("body").append(`
<div style="position: fixed;top:0;bottom:0;left:0;right:0;background:rgba(0,0,0,50%);z-index:1000;display:none;overflow:auto;padding:0;margin:0;" id="xesb_panel">
    <h1 style="position: fixed;top:0;right:0;" id="xesb_closePanel">关闭</h1>
    <center>
        <h1>xesb 面板</h1>
        <table style="width: 80%;background: rgba(255,255,255,80%);color:black" border="1">
            <tr><th id="xesb_refreshList">刷新列表</th><th id="xesb_dataOutput">输出测试数据</th><!-- <th id="xesb_dataInput">输入测试数据</th> --></tr>
        </table>
        <table style="width: 80%;background: rgba(255,255,255,80%);color:black" border="1">
            <thead>
                <tr><th>名称</th><th>副名称(如果有)</th><th>页数</th><th>下载图片进度</th><th>大小</th><th>状态</th></tr>
            </thead>
            <tbody id="xesb_displayBox">
            </tbody>
            <tfoot>
            </tfoot>
        </table>
    </center>
</div>
<div style="position: fixed;top:0;bottom:0;left:0;right:0;background:rgba(0,0,0,100%);z-index:1000;display:none;overflow:auto;padding:0;margin:0;" id="xesb_previewBox">
    <h1 style="position: fixed;top:0;right:0;" id="xesb_closePreviewBox">关闭</h1>
    <h2 style="position: fixed;bottom:0;right:0;background: rgba(0,0,0,20%);cursor:pointer;user-select:none;border-collapse:collapse;">
        <table border="1">
            <thead>
                <tr><td><h1 id="xesb_showWidth">80%</h1></td></tr>
            </thead>
            <tbody id="xesb_widthControlBox">
                <tr><td>+1</td></tr>
                <tr><td>+5</td></tr>
                <tr><td>+10</td></tr>
                <tr><td>-10</td></tr>
                <tr><td>-5</td></tr>
                <tr><td>-1</td></tr>
            </tbody>
            <tfoot>
                <tr>
                    <td>
                        高度:<input id="xesb_autoScrollHeight" value="2"><br>
                        速度:<input id="xesb_autoScrollSpeed" value="20">
                    </td>
                </tr>
                <tr><td id="xesb_autoScrollStart">开滚</td></tr>
                <tr><td id="xesb_autoScrollStop" style="display:none">停!!!</td></tr>
                <tr><td id="xesb_fullScreen">全屏</td></tr>
                <tr><td id="xesb_toTop">返回顶部</td></tr>
            </tfoot>
        </table>
    </h2>
    <center>
        <ul id="xesb_viewPage" style="width: 80%;list-style:none;margin:0;padding:0;"></ul>
    </center>
</div>
`);
    $("#xesb_dataInput").click(function () {
        let jsonstr = prompt("请粘贴文件中的字符串");
        comicInfo = JSON.parse(jsonstr);
        display();
    });
    let scroller;
    $("#xesb_autoScrollStart").click(function () {
        $(this).css("display","none");
        $("#xesb_autoScrollStop").css("display","");
        // let scrollS = Number($("#xesb_autoScrollSpeed").val());
        // let scrollH = Number($("#xesb_autoScrollHeight").val());
        scroller = setInterval(function () {
            $("#xesb_previewBox").scrollTop($("#xesb_previewBox").scrollTop()+Number($("#xesb_autoScrollHeight").val()));
        }, Number($("#xesb_autoScrollSpeed").val()));
    });
    $("#xesb_autoScrollStop").click(function () {
        $(this).css("display","none");
        $("#xesb_autoScrollStart").css("display","");
        clearInterval(scroller);
    });
    $("#xesb_fullScreen").click(fullscreenToggler);
    $("#xesb_toTop").click(function () {
        $("#xesb_previewBox").scrollTop(0);
    });
    $("#nb").append(`<div><a id="xesb_openPanel">打开xesb面板</a></div>`);
    $("#nb").css("max-width",(parseInt($("#nb").css("max-width"))||0)+100);
    $("#xesb_refreshList").click(function () {
        display();
    });
    $("#xesb_dataOutput").click(function () {
        console.log(comicInfo);
        saveAs(new Blob([JSON.stringify(comicInfo)], {
            type: 'text/plain'
        }),"comicInfo.json");
    });
    $("#xesb_openPanel").click(function () {
        $("#xesb_panel").fadeIn("fast");
    });
    $("#xesb_closePanel").click(function () {
        $("#xesb_panel").fadeOut("fast");
    });
    $("#xesb_closePreviewBox").click(function () {
        $("body").css("overflow","");
        $("#xesb_previewBox").unbind();
        $("#xesb_previewBox").fadeOut("fast");
    });
    $("#xesb_widthControlBox > tr > td").each(function (index,node) {
        $(node).click(function () {
            changeWidth([+1,+5,+10,-10,-5,-1][index]);
        });
    });
    function fullscreenToggler() {
        var element = document.documentElement;		// 返回 html dom 中的root 节点 <html>
        if(!$('body').hasClass('full-screen')) {
            $('body').addClass('full-screen');
            $('#alarm-fullscreen-toggler').addClass('active');
            // 判断浏览器设备类型
            if(element.requestFullscreen) {
                element.requestFullscreen();
            } else if (element.mozRequestFullScreen){	// 兼容火狐
                element.mozRequestFullScreen();
            } else if(element.webkitRequestFullscreen) {	// 兼容谷歌
                element.webkitRequestFullscreen();
            } else if (element.msRequestFullscreen) {	// 兼容IE
                element.msRequestFullscreen();
            }
        } else {			// 退出全屏
            console.log(document);
            $('body').removeClass('full-screen');
            $('#alarm-fullscreen-toggler').removeClass('active');
            //	退出全屏
            if(document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
    }
    $("body > div.ido > div:nth-child(2) > table.ptt > tbody > tr,body > div.ido > div:nth-child(2) > table.ptb > tbody > tr").prepend(`
        <td id="xesb_clear">清空</td>
        <td id="xesb_toggle">反选</td>
        <td id="xesb_downloadItem">开始下载</td>
        `);
    $(".gl1t > a:nth-child(1)").each(function (index, node) {
        $(node).prepend(`<input type="checkbox" id="xesb_comicCheck" value="`+$(node).attr("href")+`"/><a id="xesb_openPreviewBox" src="`+$(node).attr("href")+`">长条预览</a>`);
    });
    $("td#xesb_clear").click(function () {
        $("input#xesb_comicCheck:checked").each(function (index, node) {
            console.log(node);
            $(node).prop("checked", false);
        });
    });
    $("td#xesb_toggle").click(function () {
        $("input#xesb_comicCheck").each(function (index, node) {
            if ($(node).prop('checked')) {
                $(node).prop("checked", false);
            } else {
                $(node).prop("checked", true);
            }
        });
    });
    $("td#xesb_downloadItem").click(function () {
        let comicUrls = [];
        $("input#xesb_comicCheck:checked").each(function (index, node) {
            comicUrls.push($(node).val());
        });
        console.log(comicUrls);
        $("#xesb_panel").fadeIn("fast",function () {
            comicUrls.map(function (value) {
                addComic(value);
            });
        });
    });
    $("#gd5").append(`
<p class="g2 gsp">
    <img src="https://ehgt.org/g/mr.gif">
    <a id="xesb_downoadSelf" style="cursor:pointer">点击下载</a>
</p>
<p class="g2">
    <img src="https://ehgt.org/g/mr.gif">
    <a id="xesb_openPreviewBox" src="`+location.href+`" style="cursor:pointer">长条预览</a>
</p>`);
    $("#xesb_downoadSelf").click(function () {
        $("#xesb_panel").fadeIn("fast",function () {
            addComic(location.href);
        });
    });
    $("a#xesb_openPreviewBox").each(function (index,node) {
        $(node).click(function ({target}) {
            $("body").css("overflow","hidden");
            $("#xesb_previewBox").fadeIn("fast",function(){
                preview($(target).attr("src"));
            });
            return false;
        });
    });
})();
