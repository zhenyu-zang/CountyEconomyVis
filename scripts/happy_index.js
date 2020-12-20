var selected_keys_happy_index = ['大兴区', '怀柔区', '密云县'];
var data_file_happy_index = 'data/data.csv';
var global_data_happy_index;
let select_year_happy_index='2011';

function draw_radar_map(div_id, keys, data_map) {
	var myChart = echarts.init(document.getElementById(div_id));
	const index_keys = [
		'GDP(亿元)',
		'年末总人口(万人)',
		'城乡居民储蓄存款余额(亿元)',
		'行政区域土地面积(万平方公里)',
		'社会福利院数(个)',
		'医院、卫生院床位数(万张)',
	];
	selected = [];
	selected_data = [];
	titles = [{text: String(select_year_happy_index)+'年'+'幸福指数对比图',left: '50%',textAlign: 'center'}];

	width = 90/keys.length;

	for (key_id=0; key_id<keys.length; key_id++) {
		tmp = [];
		key = keys[key_id];
		data = data_map[key][String(select_year_happy_index)];
		for (index_key_i=0;index_key_i<index_keys.length; index_key_i++){
			if (data.hasOwnProperty(index_keys[index_key_i])) {
				value_i = parseFloat(data[index_keys[index_key_i]]);
			}
			else value_i = 0;
				tmp.push(value_i);
		}
		tmp = {name: key, 'value': tmp};
		selected_data.push(tmp);
	}

	selected[key_id] = {
		name: '幸福指数雷达图',
		type: 'radar',
		data: selected_data,
		top: 0,
		bottom: 0
	}
	indicator = [];
	for (index_key_i=0;index_key_i<index_keys.length; index_key_i++){
		indicator.push({name: index_keys[index_key_i], color: '#000'});
	}

	console.log('selected data=', selected);
	var option = {
            title: titles,
            tooltip: {
				trigger: 'item',
				formatter: function(params){
						console.log(params);
						let formatter_str = params.name + '<br>';
						for (index_key_i=0;index_key_i<index_keys.length; index_key_i++){
							formatter_str += (index_keys[index_key_i] + ':' + params.data.value[index_key_i]+ '<br>');
						}
						return formatter_str;
					},
			},
            legend: {
				show: true,
				icon: 'roundRect',// 图例项的 icon。ECharts 提供的标记类型包括 'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow'也可以通过 'image://url' 设置为图片，其中 url 为图片的链接，或者 dataURI。可以通过 'path://' 将图标设置为任意的矢量路径。 
				top: '5%',
				left: '5%',
				// itemWidth: 1,
				// itemWidth: 10,
				// itemHeight: 10,
				// itemGap: 30,
				orient: 'vertical',
				textStyle: { // 图例的公用文本样式。
				    // fontSize: 15,
				    color: '#000'
				},
			},
			radar: [
				{indicator: indicator, center: ['60%', '50%'], nameGap: 0,},
			],
		    series: selected,
			};
	myChart.clear();
	myChart.setOption(option);
}

function flush_radar_map() {
	tmp_data = {};
	for (i=0;i<selected_keys_happy_index.length;i++) {
		tmp_data[selected_keys_happy_index[i]] = {};
	}
	for (idx=0;idx<global_data_happy_index.length;idx++) {
		for (i=0;i<selected_keys_happy_index.length;i++) {
			if (global_data_happy_index[idx]['区县']==selected_keys_happy_index[i]) {
				tmp_data[selected_keys_happy_index[i]][global_data_happy_index[idx]['年份']]=global_data_happy_index[idx];
				break;
			}
		}
	}
	draw_radar_map('happy_index', selected_keys_happy_index, tmp_data);
}

function happy_index_key_update(key) {
	selected_keys_happy_index = key;
	flush_radar_map();
}

function happy_index_year_update(year) {
	select_year_happy_index = year;
	flush_radar_map();
}

function happy_index_main(OM) {
	d3.csv(data_file_happy_index).then(function(data) {
		data.splice(0,1);
		global_data_happy_index = data;
		let div = d3.select('#happy_index_grid');
		let fig = div
		.append('div')
		.attr('id', 'happy_index')
		.attr('style', 'width:100%;height:100%;');
		flush_radar_map();
		OM.subscribe('key_update', happy_index_key_update);
		OM.subscribe('year_update', happy_index_year_update);
	});
}
 