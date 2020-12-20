[toc]

## 数据说明

数据文件放在data/data.csv，utf8编码

## 接口说明

当选择县区发生改变时通过key_update主题进行发布，参数为一个字符串数组代表当前已选择的县区。

当所选年份发生改变时通过year_update主题进行发布，参数为一个int或string代表年份。

debug.js简单实现了这两个主题的发布用于调试代码。

## 可参考内容

[D3 二维图表的绘制系列 -- 含有中国地图绘制代码](https://blog.csdn.net/zjw_python/article/details/98182540/)