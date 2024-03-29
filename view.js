// 添加一堆图片
async function addPic(page, limit) {
    let start, end;
    start = (page - 1) * limit;
    end = Math.min(page * limit, pics.length);
    for (let i = start; i < end; i++) {
        pics[i].blob = await useCache("local", {name: pics[i].cache_name});
        $("#view").append(
            $(`<div class="pics"></div>`).append(
                $(`<span class="showPage"></span>`).text(pics[i].page + "/" + gallery.pages),
                $(`<img/>`).attr({
                    src: URL.createObjectURL(pics[i].blob),
                    art: pics[i].name
                })
            )
        );
    }
    idkscroll.end(end - start, pics.length);
}

// 阅读宽度
let viewWidth = 60;
// 更改阅读宽度
function changeWidth(x) {
    // 限定最大最小值
    viewWidth = Math.max(Math.min(viewWidth + x, 100), 1);

    // 展示宽度
    $(showWidthBox).text(viewWidth + "%");

    // 当前高度的比值(阅读进度)
    let heightBi = ($(document).scrollTop() - $("#view").offset().top) / $("#view").height();

    // 更改宽度
    $("#view").css("width", viewWidth + "%");

    if (heightBi > 0) {
        // 加if避免没有到阅读部分的情况
        // 修复浏览器更改宽度所导致的阅读进度偏移(说白了就是避免图片高度变了,浏览器滚动条还在原来的位置)
        $(document).scrollTop($("#view").offset().top + $("#view").height() * heightBi);
    }
}


// 自动检测并切换全屏(网上抄的)
function fullscreenToggler() {
    var element = document.documentElement;		// 返回 html dom 中的root 节点 <html>
    if (!$('body').hasClass('full-screen')) {
        $('body').addClass('full-screen');
        $('#alarm-fullscreen-toggler').addClass('active');
        // 判断浏览器设备类型
        if (element.requestFullscreen) {
            element.requestFullscreen();
        } else if (element.mozRequestFullScreen) {	// 兼容火狐
            element.mozRequestFullScreen();
        } else if (element.webkitRequestFullscreen) {	// 兼容谷歌
            element.webkitRequestFullscreen();
        } else if (element.msRequestFullscreen) {	// 兼容IE
            element.msRequestFullscreen();
        }
    } else {			// 退出全屏
        $('body').removeClass('full-screen');
        $('#alarm-fullscreen-toggler').removeClass('active');
        //	退出全屏
        if (document.exitFullscreen) {
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

// 根据object生成菜单
function showMenu(baseId, menus, appTo = $("body")) {
    // 其实内部传递的是节点,不要id也没事内
    if (baseId.constructor != String || baseId == "") {
        return false;
    }
    // 属于是一个把所有层级菜单包起来的一个大盒子
    let menusBox = $(`<div style="position:fixed;right:0;bottom:0;"></div>`);
    menusBox.attr("id", baseId);
    let boxPreId = baseId + "-box",
        btnPreId = baseId + "-btn";
    // 这个是本体,递归生成菜单(递归不用考虑变量重复问题(懒))
    // 遵循一个原则,传出本函数的都是原始element,不是jquery的对象
    function getDiv(id, list, preBox = null) {
        // console.log(0,list);
        // 这里是 这一级菜单的 一个小盒子,生成完后会添加到大盒子里
        // 按钮盒子
        let box = $(`<div class="ui vertical buttons" style="background-color: rgba(0,0,0,50%);"></div>`);
        box.attr("id", boxPreId + id);
        // 假设这个不是根目录(菜单),那就隐藏
        if (preBox != null) {
            box.css("display", "none")
        }
        // 计数工具人变量
        let index = 0;
        // 遍历传过来的菜单
        for (let i in list) {
            // 不管这一项是什么,先生成一个初始的按钮
            let butn = $(`<button type="button" class="ui inverted pink basic button"></button>`);
            butn
                .html(i)
                .attr("id", btnPreId + id + "-" + index);
            index++;
            // 1. 如果传过来的是一个函数,那么就是一个有功能的按钮,那么就把节点传过去处理
            if (list[i].constructor == Function) {
                // console.log(1,butn)
                list[i](butn.get(0));
            }
            // 2. 如果是一个对象,那么就递归给自己
            if (list[i].constructor == Object) {
                // console.log(2,t)
                // 看本函数的最后,当接收到下一级菜单节点后,存起来
                let nextBox = getDiv(id + "-" + index, list[i], box);
                // 当点击按钮后,就进入下一级目录
                butn.click(function () {
                    box.fadeOut("fast", function () {
                        nextBox.fadeIn("fast");
                    });
                });
            }
            // 3. 字符串为"close",那么点击按钮就隐藏本级菜单
            if (list[i] == "close") {
                butn.click(function () {
                    box.fadeOut("fast");
                });
            }
            // 4. 字符串为"pre"并且不是根目录
            if (list[i] == "pre" && preBox != null) {
                // 当点击按钮后,就返回上一级目录
                butn.click(function () {
                    box.fadeOut("fast", function () {
                        preBox.fadeIn("fast");
                    });
                });
            }
            // 将按钮添加到本级菜单
            box.append(butn);
        }
        // 将小盒子(菜单)添加到大盒子
        menusBox.append(box);
        // 返回本目录的盒子
        return box;
    }
    // 这里返回的是根目录的盒子,没有用,就不接收了
    getDiv("", menus);
    // 将最大的盒子添加到 body 中
    // fixed bug
    $(appTo).append(menusBox);
    // 返回最大的盒子的 element
    return menusBox.get(0);
}

// 默认全局变量
let url, pics, gallery, gid, idkscroll, menu, showWidthBox, controlBox;
// 菜单,会有xss攻击风险?没有,因为不会储存
menu = {
    "宽度": {
        "": function (node) {
            showWidthBox = node;
            $(node).text(viewWidth + "%");
            $(node).click(function () {
                let width = parseInt(prompt("请输入宽度(1-100):", viewWidth)) || viewWidth;
                viewWidth = (1 <= width && width <= 100 ? width : viewWidth);
                changeWidth(0);
            });
        },
        "+1": function (node) {
            $(node).click(function () {
                changeWidth(+1);
            });
        },
        "+5": function (node) {
            $(node).click(function () {
                changeWidth(+5);
            });
        },
        "+10": function (node) {
            $(node).click(function () {
                changeWidth(+10);
            });
        },
        "-10": function (node) {
            $(node).click(function () {
                changeWidth(-10);
            });
        },
        "-5": function (node) {
            $(node).click(function () {
                changeWidth(-5);
            });
        },
        "-1": function (node) {
            $(node).click(function () {
                changeWidth(-1);
            });
        },
        "返回": "pre"
    },
    "切换<br/>全屏": function (node) {
        $(node).click(function () {
            fullscreenToggler();
        });
    },
    "返回<br/>顶部": function (node) {
        $(node).click(function () {
            $(document).scrollTop(0);
        });
    },
    "返回<br/>画廊": function (node) {
        $(node).click(function () {
            location.href = "index.html";
        });
    }
};

// 初始化放到函数里,因为要异步
async function init() {
    // 解析网页链接
    url = new URL(location.href);

    // 获取画廊gid并查找
    gid = parseInt(url.searchParams.get("gid"));
    if (gid == NaN) {
        return;
    }

    // 初始化宽度
    $("#view").css("width", viewWidth+"%");

    // 初始化菜单
    controlBox = showMenu("controlBox", menu, $("#page"));

    // 获取所有图片(重点!)
    pics = await sendMessage({
        type: "getPics",
        gid: gid
    });

    // 获取当前画廊的详细信息(有标签和评论)
    gallery = await sendMessage({
        type: "getGalleryInfo",
        gid: gid
    });
    // 根据名字个性化标题,没有xss风险(浏览器自动转码)
    document.title = gallery.mainName + " - 观看 - XESB"

    // 初始化滚动加载
    idkscroll = new idkScroll("#view", {
        onBottom: addPic,
        limit: Math.max(1, parseInt(url.searchParams.get("limit")) || 2),
        toTop: $(window).height()
    });
}

init();