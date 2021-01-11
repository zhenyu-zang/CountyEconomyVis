var selected_keys = ['大兴区'];
var data_file = 'data/data.csv';
var global_data;
let select_year='1997';

function draw_pie(div_id, keys, data_map) {
	var myChart = echarts.init(document.getElementById(div_id));
	selected = [{
            name: '第一产业',
            type: 'bar',
			stack: 'all',
            data: []
        },
		{
            name: '第二产业',
            type: 'bar',
			stack: 'all',
            data: []
        },
		{
            name: '第三产业',
            type: 'bar',
			stack: 'all',
            data: []
        }
	];
	width = 90/keys.length;
	if (keys.length==1) rad = 45;
	else rad = width;
	sum_map = {};
	xa = [
        {
            type: 'category',
            data: []
        }
	];
	for (key_id=0; key_id<keys.length; key_id++) {
		key = keys[key_id];
		data = data_map[key][String(select_year)];
		if (data.hasOwnProperty('第一产业增加值(亿元)') && data['第一产业增加值(亿元)']!="") {
			first = parseFloat(data['第一产业增加值(亿元)']);
		}
		else first = 0;
		if (data.hasOwnProperty('第二产业增加值(亿元)') && data['第二产业增加值(亿元)']!="") {
			second = parseFloat(data['第二产业增加值(亿元)']);
		}
		else second = 0;
		if (data.hasOwnProperty('GDP(亿元)') && data['GDP(亿元)']!="") {
			third = parseFloat(data['GDP(亿元)'])-first-second;
			third = parseInt(third*100)/100;
		}
		else third = 0;
		sum=first+second+third;
		if (sum<1e-8) {
			sum=1e-8;
			first=sum/3;
			second=sum/3;
			third=sum/3;
		}
		console.log(first, second, third, sum);
		sum_map[key]=sum;
		selected[0].data.push(first/sum);
		selected[1].data.push(second/sum);
		selected[2].data.push(third/sum);
		xa[0].data.push(key);
	}
	var option = {
			title : {
				show:true, 
				text: '产业分布图',
				left: '50%',textAlign: 'center'
			},
            tooltip: {
				trigger: 'axis',
				formatter: function(params) {
					key = params[0].name;
					data = data_map[key][String(select_year)];
					prov = data['省份'];
					ret = prov+'\t'+key;
					for (idx=0;idx<params.length;idx++) {
						part=params[idx].seriesName;
						ratio = params[idx].value;
						real = ratio*sum_map[key];
						ratio = Math.round(ratio*10000)/100;
						real = Math.round(real*100)/100;
						ret = ret + '<br/>' + part + ': '+ String(real) + '亿元\t('+String(ratio)+'%)';
					}
					return ret;
				}
			},
            legend: {
                data:['第一产业', '第二产业', '第三产业'],
				top: '10%',
				left: 'center'
            },
			grid: {
				left: '3%',
				right: '4%',
				bottom: '3%',
				top: '20%',
				containLabel: true
			},
			xAxis: xa,
			yAxis: [
				{
					type: 'value',
					min:0,
					max:1
				}
			],
            series: selected
        };
	myChart.clear();
	myChart.setOption(option);
}

function flush_pie_fig() {
	tmp_data = {};
	for (i=0;i<selected_keys.length;i++) {
		tmp_data[selected_keys[i]] = {};
	}
	for (idx=0;idx<global_data.length;idx++) {
		for (i=0;i<selected_keys.length;i++) {
			if (global_data[idx]['区县']==selected_keys[i]) {
				tmp_data[selected_keys[i]][global_data[idx]['年份']]=global_data[idx];
				break;
			}
		}
	}
	draw_pie('pie_fig', selected_keys, tmp_data);
}

function key_update(key) {
	selected_keys = key;
	flush_pie_fig();
}

function year_update(year) {
	select_year = year;
	flush_pie_fig();
}

function pie_main(OM) {
	d3.csv(data_file).then(function(data) {
		data.splice(0,1);
		global_data = data;
		let div = d3.select('#pie_grid');
		let fig = div
		.append('div')
		.attr('id', 'pie_fig')
		.attr('style', 'width:100%;height:100%;');
		flush_pie_fig();
		OM.subscribe('key_update', key_update);
		OM.subscribe('year_update', year_update);
	});
}
 