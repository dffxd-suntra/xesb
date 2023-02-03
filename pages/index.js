// 添加具体的一张卡片
async function galleryToCard(gallery) {
    // 获取封面信息
    let cover = (await sendMessage({
        type: "getCover",
        gid: gallery.gid
    }));
    // 封面链接, 封面元素
    let coverUrl, coverHTML = $(`<img style="width: 100%;" src="../icons/icon-x1024.png"/>`);
    if (cover != null) {
        // 有封面就用封面
        let coverBlob = await useCache(cover.cache_name);
        coverUrl = URL.createObjectURL(coverBlob);
        // 有xss风险, 使用parseInt规避
        coverHTML.get(0).style.aspectRatio = parseInt(cover.width) + "/" + parseInt(cover.height);
        coverHTML.attr("src", coverUrl);
    }
    // 添加到区块
    $("#galleryCards").append($(`
    <div class="gallery">
        <div class="ui card">
            <div class="image">
                <a href="view.html?gid=${gallery.gid}" target="_blank">${coverHTML.prop("outerHTML")}</a>
            </div>
            <div class="content">
                <a href="view.html?gid=${gallery.gid}" target="_blank">
                    <div class="ui header">${gallery.mainName}</div>
                    <div class="meta"><span class="date">${gallery.secondaryName}</span></div>
                </a>
                <div class="description">${gallery.categories}</div>
            </div>
            <div class="extra content">
                <span>${gallery.postTime}</span>
                <span style="float: right;"><b>${gallery.pages}pages</b></span>
            </div>
        </div>
    </div>
    `));
    // 瀑布流计算
    macy.recalculate();
}

// 添加一堆卡片(页数, 每页个数)
async function showGalleryCards(page, limit) {
    // 获取一堆画廊
    let data = await sendMessage({
        type: "getGalleryInfos",
        data: {
            page: page,
            limit: limit
        }
    });
    // 数据
    let gallerys = data.gallerys;
    // 总量
    let total = data.total;
    // 批量存储并等待所有画廊的卡片加载完成
    let promiseList = [];
    for (let i in gallerys) {
        promiseList.push(galleryToCard(gallerys[i]));
    }
    Promise.all(promiseList).then(function () {
        // 计算瀑布流
        macy.recalculate();
        // 回调
        idkscroll.end(gallerys.length, total);
    });
}

// 解析当前url
let url = new URL(location.href);

// 瀑布流初始化
let macy = Macy({
    container: "#galleryCards",
    waitForImages: false,
    margin: 8,
    columns: 6,
    breakAt: {
        2000: 6,
        1800: 5,
        1200: 4,
        800: 3,
    }
});

// 滚动加载初始化
let idkscroll = new idkScroll("#galleryCards", {
    onBottom: showGalleryCards,
    page: Math.max(1, parseInt(url.searchParams.get("page")) || 1) - 1,
    limit: Math.max(1, parseInt(url.searchParams.get("limit")) || 10),
    toTop: $(window).height() / 2
});