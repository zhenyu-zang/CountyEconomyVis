// var selected_keys_line_index = ['大兴区', '怀柔区', '密云县'];
var data_file_line_index = 'data/data.csv';
// var global_data_line_index;
// let select_year_line_index='2011';

var line_selected_keys = ['大兴区', '怀柔区', '密云县'];
var line_selected_attr =  'GDP(亿元)';
var line_global_data;


function draw_line_chart(div_id, keys, key2data) {
	// console.log('--------------- drawing line chart')
	// keys: all keys (list)
	// : correspond data (including all attrs)
	var myChart = echarts.init(document.getElementById(div_id));
	// const index_keys = [
	// 	'GDP(亿元)',
	// 	'年末总人口(万人)',
	// 	'城乡居民储蓄存款余额(亿元)',
	// 	'行政区域土地面积(万平方公里)',
	// 	'社会福利院数(个)',
	// 	'医院、卫生院床位数(万张)',
	// ];
	selected = [];
	selected_data = [];

	let title_name = '';
	for (key_id=0; key_id<keys.length; ++key_id)
	{
		title_name+=(keys[key_id]+' ');
	}
	title_name+=line_selected_attr;
	title_name+='折线图';
	titles = [{text: title_name,left: '50%',textAlign: 'center'}];

	// year from 1997 to 2013
	let selected_series = [];
	let year_keys = [];
	for (i=1997; i < 2014; ++i)
	{
		year_keys.push(String(i));
	}

	let begin_year = 1997;
	let end_year = 2013;

	let all_year = [];
	for (year=begin_year; year<=end_year; ++year)
	{
		all_year.push(String(year));
	}

	for (key_id=0; key_id<keys.length; ++key_id)
	{
		cur_key_data = [];
		for (year=begin_year; year<=end_year; ++year)
		{
			cur_key_data.push(key2data[keys[key_id]][String(year)]);
		}
		selected_series.push(
			{
				name: keys[key_id],
				type: 'line',
				data:cur_key_data
			}
		)
	}

	// console.log(key2data)
	var option = {
            title: titles,
            tooltip: {
				trigger: 'axis',
				// formatter: function(params){
				// 		console.log(params);
				// 		let formatter_str = params.name + '<br>';
				// 		// for (index_key_i=0;index_key_i<index_keys.length; index_key_i++){
				// 		// 	formatter_str += (index_keys[index_key_i] + ':' + params.data.value[index_key_i]+ '<br>');
				// 		// }
				// 		return formatter_str;
				// 	},
			},
			
			xAxis: {
				type: 'category',
				boundaryGap: false,
				data: all_year
			},
			yAxis: {
				type: 'value'
			},
            legend: {
				data: keys,
				top: '10%'
			},
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				top: '20%',
				containLabel: true
			},
			
		    series: selected_series,
			};
	myChart.clear();
	myChart.setOption(option);
}

function flush_line_chart() {
	tmp_data = {};
	for (i=0;i<line_selected_keys.length;i++) {
		tmp_data[line_selected_keys[i]] = {};
	}
	// for (idx=0;idx<global_data_line_index.length;idx++) {
	// 	for (i=0;i<selected_keys_line_index.length;i++) {
	// 		if (global_data_line_index[idx]['区县']==selected_keys_line_index[i]) {
	// 			tmp_data[selected_keys_line_index[i]][global_data_line_index[idx]['年份']]=global_data_line_index[idx];
	// 			break;
	// 		}
	// 	}
	// }
	
	for (i=0;i<line_selected_keys.length;i++) 
	{
		for (idx=0;idx<line_global_data.length;idx++)
		{
			if (line_global_data[idx]['区县']==line_selected_keys[i]) 
			{
				// console.log(line_global_data[idx]);
				tmp_data[line_selected_keys[i]][line_global_data[idx]['年份']]=line_global_data[idx][line_selected_attr];
			}
		}
	}
	draw_line_chart('line_chart', line_selected_keys, tmp_data);
}

function line_chart_key_update(key) {
	line_selected_keys = key;
	flush_line_chart();
}


function updateAttr(attr) {
	line_selected_attr = attr;
	flush_line_chart();
}

function line_chart_main(OM) {
	d3.csv(data_file_line_index).then(function(data) {
		data.splice(0,1);
		line_global_data = data;
		let div = d3.select('#line_chart_grid');

		d3.select('#opts')
		.on('change', function(){
			var newAttr = String(d3.select(this).property('value'));
			updateAttr(newAttr);
		}
		)
		// let list = div
		// .append('select')
		// .attr('id', 'cputurbocheck');
		// let op = list
		// .append('option')
		let fig = div
		.append('div')
		.attr('id', 'line_chart')
		.attr('style', 'width:100%;height:100%;');

		flush_line_chart();
		OM.subscribe('key_update', line_chart_key_update);
		// OM.subscribe('attr_update', line_chart_attr_update);
	});
}
 