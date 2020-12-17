function map_main(OM) {
  let div = d3.select('#map_grid');
  var svg = div.append("svg");

  const translate = [svg.node().getBoundingClientRect().width/2, svg.node().getBoundingClientRect().height/2];

  const projection = d3.geoMercator()
                      .center([104, 32])
                      .scale(360)
                      .translate(translate);
  var path = d3.geoPath().projection(projection);
  var url = "/data/100000_full.json";

  d3.json(url).then(geojson =>{
    svg.selectAll("path")
      .data(geojson.features)
      .enter().append("path")
      .attr("d", path);
  });
}

