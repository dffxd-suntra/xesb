# xesb
exhentai/e-hentai 油猴插件,可以批量爬取图片,并且开发了预览功能

花七天做的一个小程序(练练promise
国际化以后再开发(有兴趣的话

## 必看提示!!!
![image](https://user-images.githubusercontent.com/47025714/195983186-6916d032-b144-4a50-9e20-79f083fca2ed.png)
右上角关闭 
导航栏上有"打开xesb面板"的按钮,这是每一个界面都有的,点开之后里面有两栏,一个是工具栏,另一个是相册详情 
当点击下载按钮后,选中相册将会被添加到列表中 
但是因为Javascript的特性,相册详情功能没有用(不能及时刷新),所以请按下 f12 打开"控制台"或"console"来查看详情,其下载过程中,浏览器界面会假死,请不要担心,这是单线程的问题 

## 发现界面:
![image](https://user-images.githubusercontent.com/47025714/195983011-913f9155-4a00-4f29-a7dc-37786cf557b5.png)
我专门隐藏了图片 
可以看到,每个相册预览窗口都有一个复选框和一个长条预览功能(详情见下文) 
复选框选中的相册,可以在上下分页处进行操控 

## 单个相册界面:
![image](https://user-images.githubusercontent.com/47025714/195982302-3eda89d3-c0ed-4b76-a495-2c308bba07bc.png)
可以看到,点击下载,和长条预览功能 

## 其中"长条预览界面":
![image](https://user-images.githubusercontent.com/47025714/195982881-76deefd5-941e-4bb1-bca8-c957d9fd8873.png)
右上角关闭 
右下角表格的正负数就是调整图片大小的,上面百分数就是当前图片大小 
例: 100% 就是图片占满屏幕 
其中速度就是数越小,速度越快 
特意做了动态加载功能以优化用户体验,还是因为单线程,在加载图片时,页面会稍有卡顿 
