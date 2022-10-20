/*
 *    main.js
 *    Mastering Data Visualization with D3.js
 *    2.8 - Activity: Your first visualization!
 */

const svg = d3
  .select("#chart-area")
  .append("svg")
  .attr("width", 1000)
  .attr("height", 1000);

d3.json("./data/buildings.json").then((data) => {
  data.forEach((d) => {
    d.height = Number(d.height);
  });

  const rects = svg.selectAll("rect").data(data);

  rects
    .enter()
    .append("rect")
    .attr("height", (d) => d.height)
    .attr("width", 50)
    .attr("x", (d, i) => i * 75)
    .attr("y", 0)
    .attr("fill", "grey");
});
