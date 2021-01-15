const __CONFIG__ = {
  main_id: "map_grid",
  tooltip_offset_x: 8,
  tooltip_offset_y: 8,
  duration: 200
}

function select_main(config=__CONFIG__) {
  return d3.select(`#${config.main_id}`);
}

class MapState {
  adcode = "100000";
  selected = [];
  geojsons = {};
  parents = {};
  parent_set = new Set();
  center = [104, 32];
  scale = 360;
  constructor(OM) {
    this.OM = OM;
    const div = select_main();
    const svg = this.svg = div.append("svg");
    const rect = svg.node().getBoundingClientRect();
    this.translate = [rect.width/2, rect.height/2];
    this.projection = d3.geoMercator()
                        .center(this.center)
                        .scale(this.scale)
                        .translate(this.translate);
    this.zoom = d3.zoom()
                  .translateExtent([[0, 0], [rect.width, rect.height]])
                  .scaleExtent([1, 32])
                  .on("start", this.handle_zoom_start)
                  .on("zoom", this.handle_zoom)
                  .on("end", this.handle_zoom_end);
    this.g = svg.append("g");
    // Add tooltip
    this.tooltip = div.append("div")
      .classed("tooltip", true)
      .style("opacity", 0);
    // Add select table
    this.table = div.append("table")
      .classed("select-table", true);

    svg.on("click", this.handle_svg_click);
    svg.call(this.zoom);
  }

  init() {
    return d3.json('data/geojson/geojson.parents.json')
      .then(json => {
        this.parents = json;
        for (let p of Object.values(json)) {
          this.parent_set.add(p);
        }
      });
  }

  handle_zoom_start = () => {

  }

  handle_zoom = () => {
    let transform = d3.event.transform;
    this.g.attr("transform", transform);
  }

  handle_zoom_end = () => {
    const transform = d3.event.transform;
    if (transform.k == 1) {
      this.render("100000");
    }
    else if (transform.k < 3 && this.adcode in this.parents) {
      this.render(this.parents[this.adcode]);
    }
  }

  handle_svg_click = () => {
    // console.log("svg click");
  }

  get_geojson(adcode) {
    if (adcode == undefined)
      adcode = this.adcode;
    if (adcode in this.geojsons)
      return new Promise(resolve => resolve(this.geojsons[adcode]));
    
    const url = `data/geojson/${adcode}_full.json`;
    return d3.json(url)
      .then(geojson => {
        this.geojsons[adcode] = geojson;
        return geojson;
      });
  }
  
  update_selected = () => {
    this.table.selectAll("tr")
      .data(this.selected)
      .join("tr")
      .text(d => d);
  }

  handle_select = (adcode) => {
    const i = this.selected.indexOf(adcode);
    if (i >= 0)
      this.selected.splice(i, 1);
    else
      this.selected.push(adcode);

    this.update_selected();
    this.OM.publish("select", adcode);
    this.OM.publish("selected", this.selected);
  }

  render_map = (geojson) => {
    const projection = this.projection;
    const path = d3.geoPath().projection(projection);
    this.g.selectAll("path.region")
      .data(geojson.features)
      .join("path")
      .classed("region", true)
      .classed("province", true)
      .attr("d", path)
      .on("click", (d) => {
        this.handle_select(d.properties.adcode);
      });

    return geojson;
  }
  
  render_center = (geojson) => {
    const projection = this.projection;
    const data = geojson.features.filter(d => "center" in d.properties)
  
    this.g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d =>  projection(d.properties.center)[0])
      .attr("cy", d => projection(d.properties.center)[1])
      .attr('r', 2)
      .attr('fill', "lavender");
    return geojson;
  }

  add_tooltip = () => {
    const tooltip = this.tooltip;
    this.svg.selectAll("path.region")
      .on("mouseover", function(d) {
        const event = d3.event;
        tooltip
          .html(properties2html(d.properties))  
          .transition()
          .duration(__CONFIG__.duration)
          .style("opacity", 1)
          .style("left", `${event.clientX + __CONFIG__.tooltip_offset_x}px`)
          .style("top", `${event.clientY + __CONFIG__.tooltip_offset_y}px`);
      })
      .on("mousemove", function(d) {
        const event = d3.event;
        tooltip
          .style("left", `${event.clientX + __CONFIG__.tooltip_offset_x}px`)
          .style("top", `${event.clientY + __CONFIG__.tooltip_offset_y}px`);
      })
      .on("mouseleave", function(d) {
        tooltip.transition()
          .duration(__CONFIG__.duration)
          .style("opacity", 0);
      });
  }

  add_zoom = () => {
    this.svg.selectAll("path.region")
      .on("wheel", (d) => {
        if (d3.event.wheelDelta > 0) {
          this.render(d.properties.adcode);
        }
      })
  }

  render(adcode) {
    if (this.parent_set.has(adcode)) {
      this.adcode = adcode;
      this.get_geojson()
        .then(this.render_map)
        // .then(this.render_center)
        .then(this.add_tooltip)
        .then(this.add_zoom)
        .catch(e => console.log(e));
    }
  }
}

function properties2html(properties) {
  var html = ''
  for (const [key, value] of Object.entries(properties)){
    html += `${key}: ${value}<br />`
  }
  return html;
}

function map_main(OM) {
  const state = new MapState(OM);
  state.init().then(
    () => state.render(state.adcode)
  );
}
