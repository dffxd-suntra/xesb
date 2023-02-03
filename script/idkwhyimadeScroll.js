/**
 * 仅做到底自动刷新功能
 * options: {
 *     page int 当前在第几页
 *     limit int 每页个数
 *     onBottom function 到底的回调
 *     whenEnd function 结束时的回调
 *     dontWait bool 不等待第一个回调执行完毕就可以执行第二个
 *     autoFull bool 是否在上一个回调执行完后自动定时再检测一次 这个与dontWait慎用
 *     delay int 上一个参数的时间(毫秒)
 *     toTop int 到元素下边框(不含)之前几像素就开始加载
 * }
 */
class idkScroll {
    constructor(node, { page = 0, limit = 10, onBottom = function () { }, whenEnd = function () { }, dontWait = false, autoFull = true, delay = 100, toTop = 0, total = null } = {}) {
        if (node.constructor === String) {
            node = $(node).get(0);
        }
        this.node = node;

        this.length = page * limit;

        this.total = total;

        this.limit = limit;

        this.onBottom = onBottom;

        this.whenEnd = whenEnd;

        this.dontWait = dontWait;

        this.autoFull = autoFull;

        this.delay = delay;

        this.toTop = toTop;

        // 是否正在等待回复 当this.dontWait为true时忽略
        this.waitForReturn = false;

        let that = this;
        this.proxyFunc = function () {
            that.checkBottom.apply(that);
        };

        // 开始检测
        this.scroll("on");
    }
    // 开启或关闭滚动检测(是否停止检测)
    scroll(str) {
        if (str == "on") {
            // 默认执行一遍
            this.checkBottom();

            // 开启滚动检测
            $(document).scroll(this.proxyFunc);
        }
        if (str == "off") {
            // 停止滚动检测
            $(document).off("scroll", this.proxyFunc);
        }
    }
    // 检查是否到底
    checkBottom() {
        // 合理运用表达式排序和短路来减少时间复杂度(省不了多少)
        // 只算实际高度+内边距
        if (
            // 没有加载完成为true
            !this.isEnd() &&
            // 没有正在等待回应或开启了不等待模式为true
            (!this.waitForReturn || this.dontWait) &&
            // 窗口下边框之后this.toTop像素的高度大于等于元素下边框(不含)的高度为true
            $(document).scrollTop() + $(window).height() + this.toTop >= $(this.node).offset().top + $(this.node).innerHeight()
        ) {
            this.waitForReturn = true;
            this.onBottom(Math.ceil(this.length / this.limit) + 1, this.limit, this.node, this);
        }
    }
    // 回调的回调 代表加载完成,可以继续检测
    end(length, total = null) {
        if (!this.dontWait && !this.waitForReturn) {
            return;
        }

        this.total = this.total || total;

        this.length += length;

        this.waitForReturn = false;

        if (this.isEnd()) {
            // 停止检测
            this.scroll("off");

            // 运行结束函数
            this.whenEnd(this.node, this);
        } else {
            if (this.autoFull) {
                // 小心处理异步this,setTimeout里的this将会被替换为globalThis
                let that = this;
                setTimeout(function () {
                    that.checkBottom.apply(that);
                }, this.delay);
            }
        }
    }
    // 检查结束
    isEnd() {
        return this.total != null && this.length >= this.total;
    }
}