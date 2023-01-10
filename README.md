# xesb

# 2023.1.10 我打算重写这个api(类),因为这个有点不稳定,有时好,有时坏,不好调试,结构不清晰明了,这是一个大更新,更完差不多就3.0了?我还需要做一个fetch的一个多进程下载器(用worker也可以多线程就是啦

# ⚠警告⚠!建议使用2.0版本的程序,小于2.0的油猴插件已经全部失效!

花了两天?做了几个简单的类

searchParse
解析网址search部分,具有增删改查的功能

ParseHtml
将html解析为xml document,因为dom parser不好使,
注意!解析过程中将会销掉所有的script

ParsePage
解析主页面所有的画廊
功能:
- 解析页面:
    - 解析第一页,上一页,下一页,最后一页的链接
    - 解析画廊的信息:
        - 封面
        - 主要名称
        - 页数
        - 日期
        - 在哪个收藏夹里
        - 是否有种子
        - 类型 (单行本之类的
        - 大概的分数(用户给的,精度值0.5,总量5
        - 画廊链接
        - gid
        - token
    - 获取当前是哪种页面,我给每一个页面都写了一个正则表达式
    - 你当前观看的模式,就是可以获取到你正在以列表或者卡片的方式看主页

ParseGallery
解析画廊界面
功能:
- 解析画廊界面
    - 主要名称
    - 次要名称(
    - 类型(单行本等
    - 页数
    - 每一个预览页有几张图片
    - 预览类型(获取用户选择预览为大图片或小图片
    - 上传用户名
    - 上传用户的链接
    - 封面
    - 投票人数
    - 更详细的信息
        - 上传时间(每一个链接对应一个画廊,不可更改,要新增图片或者更改信息会新分配链接
        - 自己的父级(就是自己由父级更改来的
        - 是否可见(可能是给上传者和管理员看的
        - 语言
        - 文件大小
        - 被喜欢的次数
        - 详细分数(用户打分所计算出来的平均分 分度值0.01,总分5
        - 当前在哪个收藏夹
        - 种子个数(要获取种子可以拿着
    - tags 标签
        - tag种类
        - tag名字
        - tag类型(tag的边框有实线,虚线和点线,分别对应着含有的程度
    - comment 评论(包含作者的话
        - 评论内容
        - 评论分数(赞或踩都会加或减分数
        - 评论时间戳
        - 评论类型(普通评论或者作者的话
        - 评论人
            - 用户名
            - 用户主页(其实就是搜索界面
- 解析图片详情页面 重中之重的功能
    - 图片页面url
    - 图片
        - 宽度(压缩后的
        - 高度(压缩后的
        - 链接
        - 名称
        - 图片链接(压缩后的
        - 原图链接
        - 图片索引值(int类型,图片唯一值,可以放心用来缓存数据


所有的图片数据都存在`.data.page`里,是这样子的
``` json
{
    "pageUrl": "https://exhentai.org/s/64b412b095/2282079-1",
    "pic": {
        "url": "https://zhridal.yzmjsqmesfwt.hath.network/h/64b412b095238d9fb55035af8bf4429958305f7a-85897-1200-630-jpg/keystamp=1673005500-af90006881;fileindex=111558654;xres=org/0.jpg",
        "width": 1200,
        "height": 630,
        "name": "0.jpg",
        "fileIndex": 111558654
    }
}
```
还有好多小功能,比如解析url检测用户排除了哪种类型的画廊之类的

# 示例
# 注意!空的object就是存的节点之类的,不会被json化
# 大佬轻喷,我是真的不知道怎么起名
``` json
ParsePage
{
    "info": {
        "ufirst": {},
        "uprev": {},
        "ujumpBox": {},
        "ujump": {},
        "unext": {},
        "ulast": {},
        "dfirst": {},
        "dprev": {},
        "djumpBox": {},
        "djump": {},
        "dnext": {},
        "dlast": {},
        "order": {
            "0": {},
            "1": {}
        },
        "mode": {
            "0": {},
            "1": {},
            "2": {},
            "3": {},
            "4": {}
        },
        "infoContainer": {},
        "infos": []
    },
    "data": {
        "infos": [
            {
                "name": "(C86) [RUBBISH Selecting Squad (Namonashi)] RE20 (Fate/kaleid liner Prisma Illya) [Chinese] [落莲汉化组]",
                "url": "https://exhentai.org/g/813824/da02daa65c/",
                "cover": "https://exhentai.org/t/9f/7c/9f7caba457bbcecc7ce9742262651ade0d760c6f-2243583-2120-3000-jpg_250.jpg",
                "pages": 31,
                "hasTorrents": false,
                "gid": 813824,
                "token": "da02daa65c",
                "date": "2015-05-11 15:34",
                "favorite": "Favorites 0",
                "fuzzyRating": 5,
                "type": "Doujinshi"
            },
            {
                "name": "(SC40) [Kazeuma (Minami Star)] Sekaiju no Anone 6 | 世界树的那个哟6 (Etrian Odyssey II) [Chinese] [52H里漫画组]",
                "url": "https://exhentai.org/g/282764/f605f9317e/",
                "cover": "https://exhentai.org/t/62/7f/627f9118cc8be4db79c18cc3b67f9f92de22f340-637025-1125-1600-jpg_250.jpg",
                "pages": 33,
                "hasTorrents": false,
                "gid": 282764,
                "token": "f605f9317e",
                "date": "2010-09-08 21:30",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "[Akatsuki Myuuto] Dorei Usagi to Anthony [Chinese] {Badluck1205}",
                "url": "https://exhentai.org/g/530169/044f257457/",
                "cover": "https://exhentai.org/t/9b/66/9b66b228cce07540b282723bfed52bb5a8c23d07-2647721-4133-1800-jpg_250.jpg",
                "pages": 217,
                "hasTorrents": true,
                "gid": 530169,
                "token": "044f257457",
                "date": "2012-10-01 18:24",
                "favorite": "Favorites 0",
                "fuzzyRating": 5,
                "type": "Manga"
            },
            {
                "name": "[Natsuka Q-Ya] OZ No Mahoutsukai ~Ai To Inyoku No Nikuningyou~ [Chinese]",
                "url": "https://exhentai.org/g/508486/d704a8b0b1/",
                "cover": "https://exhentai.org/t/a8/5e/a85e039add5cdf33697bc4f5205ef43c53079299-768052-1269-1800-jpg_250.jpg",
                "pages": 181,
                "hasTorrents": false,
                "gid": 508486,
                "token": "d704a8b0b1",
                "date": "2012-07-15 02:30",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Manga"
            },
            {
                "name": "[Pixiv-96317253] Bondage mercy school girl",
                "url": "https://exhentai.org/g/2168694/26eb225c83/",
                "cover": "https://exhentai.org/t/8e/04/8e04b2efbe2b1018f95668fd16e95d3ef035e9aa-207904-900-1200-jpg_250.jpg",
                "pages": 4,
                "hasTorrents": true,
                "gid": 2168694,
                "token": "26eb225c83",
                "date": "2022-03-16 03:08",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "[tokunocin (Tokuno Yuika)] Mousou Shoujo Kikuri-chan  | 想治治妹妹这个臭丫头的样子！（妄想少女篇） [Chinese] [无糖·漫画组]",
                "url": "https://exhentai.org/g/2138564/33c9b9af77/",
                "cover": "https://exhentai.org/t/e8/3f/e83f75ed0e835b5f504eacf5e614e00432418c75-494024-872-1088-jpg_250.jpg",
                "pages": 324,
                "hasTorrents": true,
                "gid": 2138564,
                "token": "33c9b9af77",
                "date": "2022-02-11 12:41",
                "favorite": "Favorites 0",
                "fuzzyRating": 5,
                "type": "Artist CG"
            },
            {
                "name": "(Shuuki Reitaisai 8) [Home Sweet Home (Shishiky)] Youmu-chan ga Adult Goods no Review o Suru Hanashi (Touhou Project) [Chinese] [十的我全都要汉化组]",
                "url": "https://exhentai.org/g/2155290/ecb51c29ed/",
                "cover": "https://exhentai.org/t/b6/bb/b6bb0f5668b02484f03b15fb5b46332bbf890f7e-1719866-4203-6091-jpg_250.jpg",
                "pages": 26,
                "hasTorrents": true,
                "gid": 2155290,
                "token": "ecb51c29ed",
                "date": "2022-03-01 14:31",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "[Tenkirin (Kanroame)] Jibun de Tsukutta Ero Trap Dungeon no Saijoukai de TS-ka Shita Sei de Ukkari Soto ni Derenaku Natte Shimatta Isekai Tensei Maou Oji-san | 在自己制作的充满色情陷阱的迷宫的最上层因为不小心性转了导致自己出不去了的转生成异世界魔王的大叔 [Chinese] [夜空下的萝莉汉化] [Digital]",
                "url": "https://exhentai.org/g/2185199/3f6d6957c8/",
                "cover": "https://exhentai.org/t/f8/37/f8377618ca78ac65fd53b486906f949e02314ec5-1076560-1600-2220-jpg_250.jpg",
                "pages": 88,
                "hasTorrents": true,
                "gid": 2185199,
                "token": "3f6d6957c8",
                "date": "2022-04-04 06:20",
                "favorite": "Favorites 0",
                "fuzzyRating": 5,
                "type": "Doujinshi"
            },
            {
                "name": "[Pixiv FANBOX] jjw [2022-12-10]",
                "url": "https://exhentai.org/g/2402557/061fed9f43/",
                "cover": "https://exhentai.org/t/2d/b1/2db1db50028942cd888ef98a7e8f0318b796ef9a-13425710-6538-6817-png_250.jpg",
                "pages": 578,
                "hasTorrents": true,
                "gid": 2402557,
                "token": "061fed9f43",
                "date": "2022-12-14 21:40",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Image Set"
            },
            {
                "name": "(C97) [Angyadow (Shikei)] Yuuki Ijiri 3 (Sword Art Online) [Chinese] [脸肿汉化组]",
                "url": "https://exhentai.org/g/1740542/498e8948b1/",
                "cover": "https://exhentai.org/t/60/20/6020a382d27e546b725d48b5d91efa3c010952c0-5822901-4275-6069-jpg_250.jpg",
                "pages": 29,
                "hasTorrents": false,
                "gid": 1740542,
                "token": "498e8948b1",
                "date": "2020-09-24 03:19",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "(C82) [KAROMIX (karory)] KAROFUL MIX EX8 (Sword Art Online) [Chinese] [琉璃神社汉化]",
                "url": "https://exhentai.org/g/522999/2c4eb256ad/",
                "cover": "https://exhentai.org/t/62/bb/62bb29c11e79b3f090ba7d0586418615c7625e9d-333688-700-987-jpg_250.jpg",
                "pages": 27,
                "hasTorrents": false,
                "gid": 522999,
                "token": "2c4eb256ad",
                "date": "2012-09-02 07:40",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "[Pixiv] Arashi & Yiduan (17305623)",
                "url": "https://exhentai.org/g/2416725/df4989c89b/",
                "cover": "https://exhentai.org/t/4e/88/4e888f4a857fa49f07038a3acfdaacae81754c39-375411-1080-1528-jpg_250.jpg",
                "pages": 391,
                "hasTorrents": true,
                "gid": 2416725,
                "token": "df4989c89b",
                "date": "2022-12-29 16:55",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Image Set"
            },
            {
                "name": "Artist | 粉红黏黏怪（ririko）",
                "url": "https://exhentai.org/g/2388286/bbeaf45173/",
                "cover": "https://exhentai.org/t/87/dd/87dd37700d0b9314cb75a5424d62be4a4207fad8-2009552-2483-1700-png_250.jpg",
                "pages": 348,
                "hasTorrents": true,
                "gid": 2388286,
                "token": "bbeaf45173",
                "date": "2022-11-29 04:54",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Image Set"
            },
            {
                "name": "[Kazbox (Kazma)] Jahy-sama wa Gaman shinai! | 賈希大人不忍耐! (Jahy-sama wa Kujikenai!) [Chinese] [Digital]",
                "url": "https://exhentai.org/g/2341039/41151e1528/",
                "cover": "https://exhentai.org/t/2a/39/2a3947ed8460ba3a309a57fef8f771d569dc546d-929473-1254-1771-jpg_250.jpg",
                "pages": 18,
                "hasTorrents": true,
                "gid": 2341039,
                "token": "41151e1528",
                "date": "2022-10-02 02:08",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "(SC2022 Autumn 2nd) [Muraimura] Oshiire no Naka de (Bocchi the Rock!)",
                "url": "https://exhentai.org/g/2380353/4a3d92555e/",
                "cover": "https://exhentai.org/t/f4/24/f424089e619a718fdde9fcd479c3c753dd90c25d-444633-2102-3018-jpg_250.jpg",
                "pages": 8,
                "hasTorrents": true,
                "gid": 2380353,
                "token": "4a3d92555e",
                "date": "2022-11-19 12:01",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "[Ubon] Ichinose Asuna no Takuhaibin (Blue Archive)",
                "url": "https://exhentai.org/g/2365313/be6c87467c/",
                "cover": "https://exhentai.org/t/e8/a3/e8a3090062b3208275c8232ae8ace4293f5fac5c-980955-1505-2124-jpg_250.jpg",
                "pages": 7,
                "hasTorrents": true,
                "gid": 2365313,
                "token": "be6c87467c",
                "date": "2022-11-01 01:54",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Artist CG"
            },
            {
                "name": "[Nutaku] Project QT - Characters",
                "url": "https://exhentai.org/g/2407023/7b4f31ea17/",
                "cover": "https://exhentai.org/t/ad/67/ad67f47ade9b4a855330c01e83c8eb69c5c00745-1447433-1024-1820-png_250.jpg",
                "pages": 558,
                "hasTorrents": true,
                "gid": 2407023,
                "token": "7b4f31ea17",
                "date": "2022-12-19 14:23",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Game CG"
            },
            {
                "name": "Lambda［Fanbox&Fantia/2022］",
                "url": "https://exhentai.org/g/2424600/4a47d1e89f/",
                "cover": "https://exhentai.org/t/c7/15/c715be03856d793e0019d4b1dfb9349f9986dcd4-4600133-2796-3588-jpg_250.jpg",
                "pages": 500,
                "hasTorrents": true,
                "gid": 2424600,
                "token": "4a47d1e89f",
                "date": "2023-01-05 05:53",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Image Set"
            },
            {
                "name": "[Nanamehan (Hansharu)] Lemon Splash [Chinese] [xyzf个人汉化] [Digital]",
                "url": "https://exhentai.org/g/2131096/03386f7eed/",
                "cover": "https://exhentai.org/t/ae/f0/aef0124dc03c29e181a153b30d3db4c9fed955e1-4067212-2591-3624-png_250.jpg",
                "pages": 28,
                "hasTorrents": true,
                "gid": 2131096,
                "token": "03386f7eed",
                "date": "2022-02-03 04:44",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "[Aomushi] Zecchou Kaihatsukyoku [Digital]",
                "url": "https://exhentai.org/g/2194320/783e2bb121/",
                "cover": "https://exhentai.org/t/55/b7/55b766b1b3c445ea725b246f2f3dcb1e98de6773-440703-1058-1500-jpg_250.jpg",
                "pages": 209,
                "hasTorrents": true,
                "gid": 2194320,
                "token": "783e2bb121",
                "date": "2022-04-15 10:49",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Manga"
            },
            {
                "name": "[Dacad] Gym Pups - Female Version (Pokemon)",
                "url": "https://exhentai.org/g/1623595/bb6c8ebbca/",
                "cover": "https://exhentai.org/t/4d/04/4d0422696bfb8b6984d1bf832e6e54698a765812-5083057-700-495-gif_250.jpg",
                "pages": 8,
                "hasTorrents": false,
                "gid": 1623595,
                "token": "bb6c8ebbca",
                "date": "2020-04-28 05:51",
                "favorite": "Favorites 1",
                "fuzzyRating": 4.5,
                "type": "Western"
            },
            {
                "name": "(C100) [Eroliya (Tamachi Yuki)] Futari kiri no Teishi Sekai",
                "url": "https://exhentai.org/g/2366636/b267a50efc/",
                "cover": "https://exhentai.org/t/4c/64/4c64ee81960e276f67bef6a90b3b92974e8fdf81-1212154-2047-3038-jpg_250.jpg",
                "pages": 72,
                "hasTorrents": true,
                "gid": 2366636,
                "token": "b267a50efc",
                "date": "2022-11-02 12:08",
                "favorite": "Favorites 1",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "●PIXIV● Edchi [12914081]",
                "url": "https://exhentai.org/g/2368759/2e9305bece/",
                "cover": "https://exhentai.org/t/eb/b0/ebb07ea74b8d2221670fde0806ab958204b3c5f5-617110-1984-2806-jpg_250.jpg",
                "pages": 71,
                "hasTorrents": true,
                "gid": 2368759,
                "token": "2e9305bece",
                "date": "2022-11-05 00:57",
                "favorite": "Favorites 0",
                "fuzzyRating": 4,
                "type": "Image Set"
            },
            {
                "name": "[Artist] NeoArtCorE",
                "url": "https://exhentai.org/g/2373938/07eb6fdb1b/",
                "cover": "https://exhentai.org/t/d0/08/d0081e69c2070d6f38ce71d28b91f9ef9ab83d46-3731828-2400-3597-jpg_250.jpg",
                "pages": 642,
                "hasTorrents": true,
                "gid": 2373938,
                "token": "07eb6fdb1b",
                "date": "2022-11-11 12:10",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Image Set"
            },
            {
                "name": "[Oneekyou (ML)] Ixioran Shintai Kensa-roku | Ixioran Medical Exam Records (Birdy the Mighty) [English] {Doujins.com} [Digital]",
                "url": "https://exhentai.org/g/2368712/99e364f479/",
                "cover": "https://exhentai.org/t/0d/73/0d7391f3f33d9c71f0ad64f0eacaed638ed1d93b-261473-1080-1518-jpg_250.jpg",
                "pages": 18,
                "hasTorrents": true,
                "gid": 2368712,
                "token": "99e364f479",
                "date": "2022-11-05 00:04",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "[fantia]竜胆",
                "url": "https://exhentai.org/g/2367071/0e54d78120/",
                "cover": "https://exhentai.org/t/75/a7/75a7c43e2cc642e30133c6c69345385861e13744-916363-1067-1063-jpg_250.jpg",
                "pages": 202,
                "hasTorrents": false,
                "gid": 2367071,
                "token": "0e54d78120",
                "date": "2022-11-03 00:49",
                "favorite": "Favorites 0",
                "fuzzyRating": 5,
                "type": "Image Set"
            },
            {
                "name": "[Azure Ghost] GADGETS γ 02",
                "url": "https://exhentai.org/g/2360223/abfdf1ec85/",
                "cover": "https://exhentai.org/t/ad/34/ad34263c1569d7b441cc819837de3705bc25e3f2-443324-2000-1251-png_250.jpg",
                "pages": 13,
                "hasTorrents": true,
                "gid": 2360223,
                "token": "abfdf1ec85",
                "date": "2022-10-26 07:30",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Artist CG"
            },
            {
                "name": "(C94) [Bitimaru (bitibiti)] Kyouko to Are Suru Hon 3 (Puella Magi Madoka Magica) [Chinese] [脸肿汉化组]",
                "url": "https://exhentai.org/g/1274741/d870799edb/",
                "cover": "https://exhentai.org/t/d1/0d/d10d88dc3e7d81cd6b57516cfd8c9be55c55e50e-11302444-2810-4000-jpg_250.jpg",
                "pages": 39,
                "hasTorrents": false,
                "gid": 1274741,
                "token": "d870799edb",
                "date": "2018-08-22 01:17",
                "favorite": "Favorites 0",
                "fuzzyRating": 5,
                "type": "Doujinshi"
            },
            {
                "name": "(C94) [Hawk Bit (Kouji)] Pink Magical Stick | 粉色的魔杖 (Mahou Shoujo Ikusei Keikaku) [Chinese] [沒有漢化]",
                "url": "https://exhentai.org/g/1286191/77db461e39/",
                "cover": "https://exhentai.org/t/4c/dc/4cdcc8403471394ea038c48bb84f06dc3be57bac-1555801-1600-2265-jpg_250.jpg",
                "pages": 39,
                "hasTorrents": false,
                "gid": 1286191,
                "token": "77db461e39",
                "date": "2018-09-13 15:27",
                "favorite": "Favorites 0",
                "fuzzyRating": 5,
                "type": "Doujinshi"
            },
            {
                "name": "媚药自慰·秘书系OL宴酱的偷欢办公室（明日方舟H·LC整合汉化组获权代发·作者公开）",
                "url": "https://exhentai.org/g/2359682/572dc759cb/",
                "cover": "https://exhentai.org/t/07/cc/07cc5d4d1f31126ec4641df3ff7ad9818a0f0256-2906457-2496-3520-jpg_250.jpg",
                "pages": 13,
                "hasTorrents": true,
                "gid": 2359682,
                "token": "572dc759cb",
                "date": "2022-10-25 11:23",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Doujinshi"
            },
            {
                "name": "[Gustav] Reika wa Karei na Boku no Maid | 蕾佳是華麗的 我的俏女傭 [Chinese]",
                "url": "https://exhentai.org/g/1145652/a0f75bfa47/",
                "cover": "https://exhentai.org/t/e8/4f/e84f81c2f10b7814b82a8402c7d11c6b4a6da1ae-1988807-1300-1783-jpg_250.jpg",
                "pages": 235,
                "hasTorrents": false,
                "gid": 1145652,
                "token": "a0f75bfa47",
                "date": "2017-11-23 14:54",
                "favorite": "Favorites 0",
                "fuzzyRating": 5,
                "type": "Manga"
            },
            {
                "name": "[Pixiv] Todo o (18961759)",
                "url": "https://exhentai.org/g/2392102/924a68e251/",
                "cover": "https://exhentai.org/t/3c/d7/3cd720e4749f6ea05881ad6c2d502b5b9a01908e-1917526-1219-1505-jpg_250.jpg",
                "pages": 1434,
                "hasTorrents": true,
                "gid": 2392102,
                "token": "924a68e251",
                "date": "2022-12-03 05:48",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Image Set"
            },
            {
                "name": "[Pixiv] エンテンカ (11939973)",
                "url": "https://exhentai.org/g/2355975/adbd471329/",
                "cover": "https://exhentai.org/t/5a/68/5a6895d62054b46830c8cc0f4efb271d2b0dbfbe-3849564-2300-3000-png_250.jpg",
                "pages": 545,
                "hasTorrents": true,
                "gid": 2355975,
                "token": "adbd471329",
                "date": "2022-10-21 02:03",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Image Set"
            },
            {
                "name": "（KILLERJACK4个人汉化）♥AsOrdered♥",
                "url": "https://exhentai.org/g/2317079/da06e70d2d/",
                "cover": "https://exhentai.org/t/55/8a/558a87ad5e27ce2fe00bcb3aa498fe3b4b22ecce-397624-1034-1462-jpg_250.jpg",
                "pages": 5,
                "hasTorrents": true,
                "gid": 2317079,
                "token": "da06e70d2d",
                "date": "2022-09-03 07:55",
                "favorite": "Favorites 0",
                "fuzzyRating": 4.5,
                "type": "Western"
            }
        ],
        "firstPageUrl": "https://exhentai.org/favorites.php",
        "lastPageUrl": "https://exhentai.org/favorites.php"
    },
    "url": "https://exhentai.org/favorites.php",
    "urlInfo": {
        "hash": "",
        "host": "exhentai.org",
        "hostname": "exhentai.org",
        "href": "https://exhentai.org/favorites.php",
        "origin": "https://exhentai.org",
        "pathname": "/favorites.php",
        "port": "",
        "protocol": "https:",
        "search": "",
        "searchInfo": {
            "searchMap": {}
        }
    },
    "next": null,
    "page": 14,
    "mode": "Thumbnail",
    "modeLabel": {
        "m": "Minimal",
        "p": "Minimal+",
        "l": "Compact",
        "e": "Extended",
        "t": "Thumbnail"
    },
    "selector": {
        "ufirst": "#ufirst",
        "uprev": "#uprev",
        "ujumpBox": "#ujumpbox",
        "ujump": "#ujump",
        "unext": "#unext",
        "ulast": "#ulast",
        "dfirst": "#dfirst",
        "dprev": "#dprev",
        "djumpBox": "#djumpbox",
        "djump": "#djump",
        "dnext": "#dnext",
        "dlast": "#dlast",
        "order": ".searchnav > div > select:contains('Published Time')",
        "mode": ".searchnav > div > select:contains('Minimal')",
        "infoContainer": "#favform > div.itg.gld",
        "infos": "#favform > div.itg.gld > div"
    },
    "xmldocument": {
        "location": null
    }
}
```
``` json
ParseGallery
{
    "info": {
        "body": {},
        "foot": {},
        "firstName": {},
        "secendName": {},
        "cover": {},
        "type": {},
        "auther": {},
        "infos": {},
        "rating": {},
        "addToFavorites": {},
        "tag": {},
        "headSidebar": {},
        "rows": {},
        "mode": {},
        "comment": {}
    },
    "data": {
        "page": [],
        "tag": {
            "parody": [
                {
                    "type": 1,
                    "name": "cardcaptor_sakura",
                    "url": "https://exhentai.org/tag/parody:cardcaptor+sakura"
                },
                {
                    "type": 1,
                    "name": "ensemble_stars",
                    "url": "https://exhentai.org/tag/parody:ensemble+stars"
                },
                {
                    "type": 1,
                    "name": "fate_grand_order",
                    "url": "https://exhentai.org/tag/parody:fate+grand+order"
                },
                {
                    "type": 0,
                    "name": "genshin_impact",
                    "url": "https://exhentai.org/tag/parody:genshin+impact"
                },
                {
                    "type": 1,
                    "name": "jibaku_shounen_hanako-kun",
                    "url": "https://exhentai.org/tag/parody:jibaku+shounen+hanako-kun"
                },
                {
                    "type": 1,
                    "name": "neon_genesis_evangelion",
                    "url": "https://exhentai.org/tag/parody:neon+genesis+evangelion"
                },
                {
                    "type": 1,
                    "name": "pokemon",
                    "url": "https://exhentai.org/tag/parody:pokemon"
                },
                {
                    "type": 1,
                    "name": "splatoon",
                    "url": "https://exhentai.org/tag/parody:splatoon"
                },
                {
                    "type": 1,
                    "name": "the_legend_of_zelda",
                    "url": "https://exhentai.org/tag/parody:the+legend+of+zelda"
                }
            ],
            "character": [
                {
                    "type": 1,
                    "name": "aether",
                    "url": "https://exhentai.org/tag/character:aether"
                },
                {
                    "type": 1,
                    "name": "alexander",
                    "url": "https://exhentai.org/tag/character:alexander"
                },
                {
                    "type": 1,
                    "name": "astolfo",
                    "url": "https://exhentai.org/tag/character:astolfo"
                },
                {
                    "type": 1,
                    "name": "chongyun",
                    "url": "https://exhentai.org/tag/character:chongyun"
                },
                {
                    "type": 1,
                    "name": "gorou",
                    "url": "https://exhentai.org/tag/character:gorou"
                },
                {
                    "type": 1,
                    "name": "hu_tao",
                    "url": "https://exhentai.org/tag/character:hu+tao"
                },
                {
                    "type": 1,
                    "name": "link",
                    "url": "https://exhentai.org/tag/character:link"
                },
                {
                    "type": 1,
                    "name": "shinji_ikari",
                    "url": "https://exhentai.org/tag/character:shinji+ikari"
                },
                {
                    "type": 1,
                    "name": "syaoran_li",
                    "url": "https://exhentai.org/tag/character:syaoran+li"
                },
                {
                    "type": 1,
                    "name": "venti",
                    "url": "https://exhentai.org/tag/character:venti"
                },
                {
                    "type": 1,
                    "name": "xiao",
                    "url": "https://exhentai.org/tag/character:xiao"
                },
                {
                    "type": 1,
                    "name": "xingqiu",
                    "url": "https://exhentai.org/tag/character:xingqiu"
                }
            ],
            "artist": [
                {
                    "type": 0,
                    "name": "g1",
                    "url": "https://exhentai.org/tag/artist:g1"
                }
            ],
            "male": [
                {
                    "type": 1,
                    "name": "ahegao",
                    "url": "https://exhentai.org/tag/male:ahegao"
                },
                {
                    "type": 0,
                    "name": "anal",
                    "url": "https://exhentai.org/tag/male:anal"
                },
                {
                    "type": 0,
                    "name": "anal_intercourse",
                    "url": "https://exhentai.org/tag/male:anal+intercourse"
                },
                {
                    "type": 1,
                    "name": "bestiality",
                    "url": "https://exhentai.org/tag/male:bestiality"
                },
                {
                    "type": 1,
                    "name": "low_bestiality",
                    "url": "https://exhentai.org/tag/male:low+bestiality"
                },
                {
                    "type": 1,
                    "name": "males_only",
                    "url": "https://exhentai.org/tag/male:males+only"
                },
                {
                    "type": 1,
                    "name": "mesuiki",
                    "url": "https://exhentai.org/tag/male:mesuiki"
                },
                {
                    "type": 1,
                    "name": "mind_control",
                    "url": "https://exhentai.org/tag/male:mind+control"
                },
                {
                    "type": 1,
                    "name": "nakadashi",
                    "url": "https://exhentai.org/tag/male:nakadashi"
                },
                {
                    "type": 1,
                    "name": "pantyhose",
                    "url": "https://exhentai.org/tag/male:pantyhose"
                },
                {
                    "type": 0,
                    "name": "shotacon",
                    "url": "https://exhentai.org/tag/male:shotacon"
                },
                {
                    "type": 0,
                    "name": "tomgirl",
                    "url": "https://exhentai.org/tag/male:tomgirl"
                },
                {
                    "type": 1,
                    "name": "x-ray",
                    "url": "https://exhentai.org/tag/male:x-ray"
                },
                {
                    "type": 0,
                    "name": "yaoi",
                    "url": "https://exhentai.org/tag/male:yaoi"
                }
            ],
            "female": [
                {
                    "type": 2,
                    "name": "nakadashi",
                    "url": "https://exhentai.org/tag/female:nakadashi"
                }
            ],
            "other": [
                {
                    "type": 1,
                    "name": "uncensored",
                    "url": "https://exhentai.org/tag/other:uncensored"
                }
            ]
        },
        "comment": [
            {
                "uploder": {
                    "name": "pootis1234",
                    "url": "https://exhentai.org/uploader/pootis1234"
                },
                "content": "https://jjw.fanbox.cc/https://www.pixiv.net/users/5775228https://twitter.com/jjw00123",
                "score": null,
                "type": 0,
                "timestamp": 1673703649704
            },
            {
                "uploder": {
                    "name": "Swiss77",
                    "url": "https://exhentai.org/uploader/Swiss77"
                },
                "content": "哇 都是无码的小鸡鸡 画得真好！！",
                "score": null,
                "type": 0,
                "timestamp": 1658739349705
            },
            {
                "uploder": {
                    "name": "IshidaGorou",
                    "url": "https://exhentai.org/uploader/IshidaGorou"
                },
                "content": "又可以一邊看著小男孩可愛的小雞雞一邊擼管了",
                "score": null,
                "type": 0,
                "timestamp": 1659323029705
            },
            {
                "uploder": {
                    "name": "sirisxpe",
                    "url": "https://exhentai.org/uploader/sirisxpe"
                },
                "content": "是无码的正太小穴和鸡鸡！",
                "score": null,
                "type": 0,
                "timestamp": 1660735369706
            },
            {
                "uploder": {
                    "name": "蛤塔尼斯",
                    "url": "https://exhentai.org/uploader/蛤塔尼斯"
                },
                "content": "万叶里面果然应该是裤袜。",
                "score": null,
                "type": 0,
                "timestamp": 1660927009706
            },
            {
                "uploder": {
                    "name": "Vivimoe",
                    "url": "https://exhentai.org/uploader/Vivimoe"
                },
                "content": "全下载下来要6W配额，这可怎么办啊，升级到顶才5W",
                "score": null,
                "type": 0,
                "timestamp": 1663217749706
            },
            {
                "uploder": {
                    "name": "xXfiloXx",
                    "url": "https://exhentai.org/uploader/xXfiloXx"
                },
                "content": "torrent plz?",
                "score": null,
                "type": 0,
                "timestamp": 1668172069707
            },
            {
                "uploder": {
                    "name": "MoonLodeLord",
                    "url": "https://exhentai.org/uploader/MoonLodeLord"
                },
                "content": "哈哈哈，鸣人和他儿子都被上过了",
                "score": null,
                "type": 0,
                "timestamp": 1668333049707
            }
        ],
        "infos": {
            "Posted": "2022-12-14 21:40",
            "Parent": "2348542",
            "Visible": "Yes",
            "Language": "Japanese  ",
            "File Size": "6.91 GB",
            "Length": "578 pages",
            "Favorited": "1380 times"
        }
    },
    "url": "https://exhentai.org/g/2402557/061fed9f43/?p=6",
    "urlInfo": {
        "hash": "",
        "host": "exhentai.org",
        "hostname": "exhentai.org",
        "href": "https://exhentai.org/g/2402557/061fed9f43/?p=6",
        "origin": "https://exhentai.org",
        "pathname": "/g/2402557/061fed9f43/",
        "port": "",
        "protocol": "https:",
        "search": "?p=6",
        "searchInfo": {
            "searchMap": {}
        }
    },
    "xmldocument": {
        "location": null
    },
    "selector": {
        "body": "#gdt",
        "foot": "#cdiv",
        "firstName": "#gn",
        "secendName": "#gj",
        "cover": "#gd1 > div",
        "type": "#gdc > div",
        "auther": "#gdn > a",
        "infos": "#gdd > table",
        "rating": "#gdr > table",
        "addToFavorites": "#gdf",
        "tag": "#taglist > table",
        "headSidebar": "#gd5",
        "rows": "#gdo2",
        "mode": "#gdo4",
        "comment": "#cdiv",
        "preview": ".gdtl"
    },
    "mode": "Normal",
    "rating": 4.66,
    "ragingCount": 183,
    "firstname": "[Pixiv FANBOX] jjw [2022-12-10]",
    "secendName": "",
    "cover": "https://exhentai.org/t/2d/b1/2db1db50028942cd888ef98a7e8f0318b796ef9a-13425710-6538-6817-png_250.jpg",
    "type": "Image Set",
    "auther": "pootis1234",
    "autherUrl": "https://exhentai.org/uploader/pootis1234",
    "pages": 578,
    "limit": 20,
    "torrentNum": 1
}
````
