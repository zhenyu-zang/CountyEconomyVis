function append_button(div) {
    let button = div.append('button');
    
    function clicked_publish() {
        OM.publish('clicked', {
            text: "Button clicked!"
        });
    }

    button.text('这是button')
        .on('click', clicked_publish);
}

function append_input(div) {
    let input = div
    .append('input')
    .attr('type', 'text');

    function changed_publish() {
        OM.publish('changed', {
            text: input.node().value
        });
    }

    input.on('change', changed_publish);
}

function append_button_div(div) {
    let button_div = div.append('div');
    function clicked_callback(obj) {
        button_div.append('p').text(obj.text);
    }
    OM.subscribe('clicked', clicked_callback);
}

function append_textarea(div) {
    let text = div.append('textarea');
    text.text('这是text');

    function text_callback(obj) {
        text.text(obj.text);
    }

    OM.subscribe('changed', text_callback);
}

function append_selected(div) {
    // Add "select" subscriber
    let text = div.append('textarea').text('Select: None');

    function select_callback(adcode) {
        text.text(`Select: ${adcode}`);
    }
    OM.subscribe('select', select_callback);

    // Add "selected" subscriber
    let table = div.append('table');

    function selected_callback(selected) {
        table.selectAll("tr")
            .data(selected)
            .join("tr")
            .text(adcode => adcode);
    }

    OM.subscribe('selected', selected_callback);
}

function example1(OM) {
    let div = d3.select('#example1');
    append_button(div);
    div.append("br");
    append_input(div);
}

function example2(OM) {
    let div = d3.select('#example2');
    // append_input(div);
    // div.append("br");
    // append_button(div);
    div.append("br");
    append_selected(div);
}

function example3(OM) {
    let div = d3.select('#example3');
    append_button_div(div);
    div.append("br");
    append_textarea(div);
}

function example4(OM) {
    let div = d3.select('#example4');
    append_textarea(div);
    div.append("br");
    append_button_div(div);
}
