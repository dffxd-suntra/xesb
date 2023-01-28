async function galleryToCard(gallery) {
    let cover = (await sendMessage({
        type: "getCover",
        gid: gallery.gid
    }));
    let coverBlob = await useCache(cover.cache_name);
    let coverUrl = URL.createObjectURL(coverBlob);
    return $(`
    <div class="gallery">
        <div class="ui card">
            <div class="image">
                <a href="view.html?gid=${gallery.gid}" target="_blank"><img src="${coverUrl}" style="aspect-ratio: ${cover.width}/${cover.height};width: 100%;"/></a>
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
    `);
}

async function showGalleryCards(page, limit) {
    updateUrl(page, limit);
    let data = await sendMessage({
        type: "getGalleryInfos",
        data: {
            page: page,
            limit: limit
        }
    });
    let gallerys = data.gallerys;
    let total = data.total;
    let galleryCards = [];
    // 这里确实可以优化成异步来优化用户体验
    for (let i in gallerys) {
        galleryCards.push(await galleryToCard(gallerys[i]));
    }
    $("#galleryCards").append(galleryCards);
    macy.recalculate();
    idkscroll.end(gallerys.length, total);
}

function updateUrl(page, limit) {
    history.pushState({}, document.title, `?limit=${limit}&page=${page}`);
}

let url = new URL(location.href);

let macy = Macy({
    container: "#galleryCards",
    trueOrder: false,
    waitForImages: false,
    margin: 8,
    columns: 6,
    breakAt: {
        2000: 6,
        1800: 5,
        1200: 4,
        800: 3,
        600: 2,
    }
});

let idkscroll = new idkScroll("#galleryCards", {
    onBottom: showGalleryCards,
    page: Math.max(1, parseInt(url.searchParams.get("page")) || 1) - 1,
    limit: Math.max(1, parseInt(url.searchParams.get("limit")) || 10)
});