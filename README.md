# xesb

## okok,用了一晚上的时间,我重构了一下代码,接下来是文档

本脚本兼容内,外站,只兼容浏览页面,画廊页面和画廊中的图片浏览页面  

浏览页面包括: 普通页面,流行页面,收藏夹页面  
1. https://e-hentai.org/
2. https://e-hentai.org/popular
3. https://e-hentai.org/favorites.php

画廊页面示例: https://e-hentai.org/g/2416725/df4989c89b/  
图片浏览页面示例: https://e-hentai.org/s/4e888f4a85/2416725-1  
笑死,怎么做文档  

``` javascript
xesb = new XESB();

b = new xesb.ParsePage("https://e-hentai.org/");

b = new xesb.ParseGallery("https://e-hentai.org/g/2416725/df4989c89b/");

b = new xesb.ParseImgPage("https://e-hentai.org/s/4e888f4a85/2416725-1");
```
