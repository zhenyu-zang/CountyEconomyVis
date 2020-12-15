function debug_append_button(div) {
    let button = div.append('button');
	let state = 0;
    
    function clicked_publish() {
		if (state==0) {
			state = 1;
			keys = ['怀柔区', '井陉县', '西华县'];
		}
		else if (state==1) {
			state = 2;
			keys = ['沅江市'];
		}
		else {
			state = 0;
			keys = ['江华自治县', '三水区'];
		}
        OM.publish('key_update', keys);
    }

    button.text('换一组县区')
        .on('click', clicked_publish);
}

function debug_append_input(div) {
    let input = div
    .append('input')
    .attr('type', 'text');

    function changed_publish() {
        OM.publish('year_update', input.node().value);
    }

    input.on('change', changed_publish);
}

function debug(OM) {
    let div = d3.select('#example1');
    debug_append_button(div);
    div.append("br");
    debug_append_input(div);
}