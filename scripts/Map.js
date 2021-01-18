const __CONFIG__ = {
  main_id: "map_grid",
  tooltip_offset_x: 8,
  tooltip_offset_y: 8,
  duration: 200,
  tooltip_opacity: 0.8
}

function select_main(config=__CONFIG__) {
  return d3.select(`#${config.main_id}`);
}

class MapState {
  adcode = "100000";
  selected = [];
  geojsons = {};
  single_geojsons = {};
  parents = {};
  parent_set = new Set();
  center = [104, 32];
  scale = 360;
  constructor(OM) {
    this.OM = OM;
    const div = select_main();
    const svg = this.svg = div.append("svg").classed("map", true);
    const rect = svg.node().getBoundingClientRect();
    this.translate = [rect.width/2, rect.height/2];
    this.projection = d3.geoMercator()
                        .center(this.center)
                        .scale(this.scale)
                        .translate(this.translate);
    this.zoom = d3.zoom()
                  .translateExtent([[-5, -5], [rect.width+5, rect.height+5]])
                  .scaleExtent([1, 32])
                  .on("start", this.handle_zoom_start)
                  .on("zoom", this.handle_zoom)
                  .on("end", this.handle_zoom_end);
    
    // Add groups
    this.map_g = svg.append("g")
        .classed("regions", true);
    this.current_g = this.map_g.append("g")
        .classed("current-regions", true);
    this.selected_g = this.map_g.append("g")
        .classed("selected-regions", true);
    // Add tooltip
    this.tooltip = div.append("div")
      .classed("tooltip", true)
      .style("opacity", 0);
    // Add select table
    this.table = div.append("table")
      .classed("selected-counties", true);

    svg.call(this.zoom);
  }

  init() {
    const csv = d3.csv('data/data.csv')
      .then(data => {
        data.splice(0,1);
        // this.csv = data;
        this.adcode_with_data = {};

        const proc = (entry) => {
          const adcode = entry.区县行政区划码;
          const adname = entry.区县;
          const year = entry.年份;
          delete entry.省份;
          delete entry.省行政区划码;
          delete entry.城市代码;
          delete entry.城市;
          delete entry.区县行政区划码;
          delete entry.区县;
          delete entry.年份;
          return [adcode, adname, year, entry];
        }

        for (let entry of data) {
          let [adcode, adname, year, value] = proc(entry);
          if (adcode == "")
            continue;
          if (!(adcode in this.adcode_with_data))
            this.adcode_with_data[adcode] = {区县: adname};
          this.adcode_with_data[adcode][year] = value;
        }
      });
    const json = d3.json('data/geojson/geojson.parents.json')
      .then(data => {
        this.parents = data;
        for (let p of Object.values(data)) {
          this.parent_set.add(p);
        }
      });
    return Promise.all([csv, json]);
  }

  // Filter valid adcode.
  // All special cases should be defined here.
  valid_adcode_filter = (adcode) => {
    return adcode in this.adcode_with_data;
  }

  adcodes2adnames = (adcodes) => {
    return adcodes
      .filter(this.valid_adcode_filter)
      .map(adcode => this.adcode_with_data[adcode].区县);
  }

  handle_zoom_start = () => {

  }

  handle_zoom = () => {
    let transform = d3.event.transform;
    this.map_g.attr("transform", transform);
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

  async get_single_geojson(adcode) {
    if (adcode in this.single_geojsons)
      return this.single_geojsons[adcode];

    const geojson = await this.get_geojson();
    for (let feature of geojson.features) {
      if (feature.properties.adcode == adcode) {
        this.single_geojsons[adcode] = feature;
        return feature;
      }
    }
  }
  
  update_selected_table = () => {
    const data = this.selected.filter(this.valid_adcode_filter);
    const entries = this.table.selectAll("tr")
      .data(data)
      .join("tr")
      .classed("selected-counties", true)
      .text(adcode => "");  // Necessary
    entries
      .append("td")
        .classed("selected-counties", true)
        .text(adcode => this.adcode_with_data[adcode].区县);
    entries
      .append("td")
        .classed("selected-counties", true)
      .append("button")
        .text("delete")
        .on("click", (adcode) => this.handle_select(adcode));
  }

  handle_select = async (adcode) => {
    const i = this.selected.indexOf(adcode);
    if (i >= 0)
      this.selected.splice(i, 1);
    else
      this.selected.push(adcode);

    await this.get_single_geojson(adcode);

    this.update_selected_table();
    this.update_map();

    this.OM.publish("select", adcode);
    this.OM.publish("selected", this.selected);
    if (this.valid_adcode_filter(adcode)) {
      OM.publish('key_update', this.adcodes2adnames(this.selected));
    }
  }

  update_map = () => {
    const path = d3.geoPath().projection(this.projection);
    const data = this.selected
      .filter(this.valid_adcode_filter)
      .filter(adcode => {
        if (adcode in this.parents) {   // Filter directed ancestor
          adcode = this.parents[adcode];
          if (adcode == this.adcode)
            return false;
        }
        while(adcode in this.parents) { // Filter indirect ancestor
          adcode = this.parents[adcode];
          if (adcode == this.adcode)
            return true;
        }
        return false;
      })
      .map(adcode => this.single_geojsons[adcode]);
    this.selected_g
      .selectAll("path.region")
      .data(data)
      .join("path")
        .classed("region", true)
        .attr("d", path);

    this.current_g
      .selectAll("path.region")
        .classed("selected-region", d => {
          const adcode = d.properties.adcode;
          return this.selected.includes(adcode) && this.valid_adcode_filter(adcode);
        });
  }

  render_map = (geojson) => {
    const projection = this.projection;
    const path = d3.geoPath().projection(projection);
    this.current_g
      .selectAll("path.region")
      .data(geojson.features)
      .join("path")
        .classed("region", true)
        .attr("d", path)
        .on("click", d => {
          this.handle_select(d.properties.adcode);
        });

    this.update_map();
    return geojson;
  }
  
  render_center = (geojson) => {
    const projection = this.projection;
    const data = geojson.features.filter(d => "center" in d.properties)
  
    this.map_g.selectAll("circle")
      .data(data)
      .enter()
      .append("circle")
      .attr("cx", d =>  projection(d.properties.center)[0])
      .attr("cy", d => projection(d.properties.center)[1])
      .attr('r', 2)
      .attr('fill', "lavender");
    return geojson;
  }

  tooltip_html(properties) {
    var html = '';
    for (const [key, value] of Object.entries(properties)){
      html += `${key}: ${value}<br />`
    }
    return html;
  }

  add_tooltip = () => {
    const tooltip = this.tooltip;
    this.svg.selectAll("path.region")
      .on("mouseover", (d) => {
        const event = d3.event;
        tooltip
          .html(this.tooltip_html(d.properties))
          .transition()
          .duration(__CONFIG__.duration)
          .style("opacity", __CONFIG__.tooltip_opacity)
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

  render_time_slider() {
    const years = d3.range(0, 17)
      .map(d => new Date(1997+d, 1, 1));
    this.time_slider = d3
      .sliderBottom()
        .min(d3.min(years))
        .max(d3.max(years))
        .step(1000*60*60*24*365)
        .width(300)
        .tickFormat(d3.timeFormat('%Y'))
        .tickValues(years.filter((d, i) => i % 2 == 0))
        .default(new Date(1997, 1, 1))
        .on("onchange", val => {
          this.OM.publish("year_update", val.getFullYear());
        })
    this.svg
      .append('g')
        .classed('time-slider', true)
        .call(this.time_slider);
  }
}

async function map_main(OM) {
  const state = new MapState(OM);
  await state.init();
  state.render(state.adcode);
  state.render_time_slider();
}
