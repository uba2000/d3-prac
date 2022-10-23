/*
 *    main.js
 *    Mastering Data Visualization with D3.js
 *    Project 3 - CoinStats
 */

const MARGIN = { LEFT: 100, RIGHT: 100, TOP: 50, BOTTOM: 100 };
const WIDTH = 800 - MARGIN.LEFT - MARGIN.RIGHT;
const HEIGHT = 500 - MARGIN.TOP - MARGIN.BOTTOM;

const svg = d3
  .select("#chart-area")
  .append("svg")
  .attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
  .attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM);

const g = svg
  .append("g")
  .attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`);

// time parser for x-scale
const parseTime = d3.timeParse("%d/%m/%Y");
const formatTime = d3.timeFormat("%d/%m/%Y");
// for tooltip
const bisectDate = d3.bisector((d) => d.date).left;

let filteredData = {};

// initialize line
g.append("path")
  .attr("class", "line")
  .attr("fill", "none")
  .attr("stroke", "grey")
  .attr("stroke", "#0069FF")
  .attr("stroke-width", "1.5px");

// scales
const x = d3.scaleTime().range([0, WIDTH]);
const y = d3.scaleLinear().range([HEIGHT, 0]);

// axis generators
const xAxisCall = d3.axisBottom();
const yAxisCall = d3
  .axisLeft()
  .ticks(6)
  .tickFormat((d) => `${parseInt(d / 1000)}k`);

// axis groups
const xAxis = g
  .append("g")
  .attr("class", "x axis")
  .attr("transform", `translate(0, ${HEIGHT})`);
const yAxis = g.append("g").attr("class", "y axis");

// x-axis label
const xLabel = g
  .append("text")
  .attr("class", "x axislabel")
  .attr("y", HEIGHT + 50)
  .attr("x", WIDTH / 2)
  .attr("font-size", "20px")
  .attr("text-anchor", "middle")
  .text("Time");
// y-axis label
const yLabel = g
  .append("text")
  .attr("class", "y axislabel")
  .attr("transform", "rotate(-90)")
  .attr("y", -60)
  .attr("x", -170)
  .attr("font-size", "20px")
  .style("text-anchor", "middle")
  .text("Price ($)");
// xAxis change label
const xChangeLabel = g
  .append("text")
  .attr("class", "x change label")
  .attr("x", 0)
  .attr("y", HEIGHT + 15)
  .attr("dy", ".4rem")
  .attr("font-size", "14px")
  .style("display", "none")
  .attr("text-anchor", "middle");
// yAxis change label
const yChangeLabel = g
  .append("text")
  .attr("class", "y change label")
  .attr("x", 0)
  .attr("y", 0)
  .attr("dy", ".31rem")
  .attr("font-size", "14px")
  .style("display", "none")
  .attr("text-anchor", "end");

// listeners
$("#coin-select").on("change", update);
$("#var-select").on("change", update);

// add slider
$("#date-slider").slider({
  range: true,
  max: parseTime("31/10/2017").getTime(),
  min: parseTime("12/5/2013").getTime(),
  step: 86400000, // one day
  values: [parseTime("12/5/2013").getTime(), parseTime("31/10/2017").getTime()],
  slide: (event, ui) => {
    $("#dateLabel1").text(formatTime(new Date(ui.values[0])));
    $("#dateLabel2").text(formatTime(new Date(ui.values[1])));
    update();
  },
});

// line path generator
// const line = d3
//   .line()
//   .x((d) => x(d.year))
//   .y((d) => y(d.value));

d3.json("data/coins.json").then((data) => {
  // clean data
  for (const coin in data) {
    filteredData[coin] = data[coin]
      .filter((d) => {
        const dataExists = d["24h_vol"] && d.market_cap && d.price_usd;
        return dataExists;
      })
      .map((d) => {
        d["price_usd"] = Number(d["price_usd"]);
        d["24h_vol"] = Number(d["24h_vol"]);
        d["market_cap"] = Number(d["market_cap"]);
        d["date"] = parseTime(d["date"]);
        return d;
      });
  }

  // run visualization
  update();
});

function update() {
  const t = d3.transition().duration(1000);

  // filter data by selections
  const coin = $("#coin-select").val();
  const yValue = $("#var-select").val();
  const sliderValues = $("#date-slider").slider("values");
  const dataTimeFiltered = filteredData[coin].filter((d) => {
    return d.date >= sliderValues[0] && d.date <= sliderValues[1];
  });

  // set scale domains
  x.domain(d3.extent(dataTimeFiltered, (d) => d.date));
  y.domain([
    d3.min(dataTimeFiltered, (d) => d[yValue]) / 1.005,
    d3.max(dataTimeFiltered, (d) => d[yValue]) * 1.005,
  ]);

  // fix for format values
  const formatSi = d3.format(".2s");
  function formatAbbreviation(x) {
    const s = formatSi(x);
    switch (s[s.length - 1]) {
      case "G":
        return s.slice(0, -1) + "B"; // billion
      case "k":
        return s.slice(0, -1) + "K"; // thousand
    }
    console.log(coin);
    return `${yValue !== "24h_vol" ? "$" : ""}${s}`;
  }

  // update scales
  xAxis.transition(t).call(xAxisCall.scale(x));
  yAxis.transition(t).call(yAxisCall.scale(y).tickFormat(formatAbbreviation));

  // clear old tooltips
  d3.select(".focus").remove();
  d3.select(".overlay").remove();

  /******************************** Tooltip Code ********************************/

  const focus = g.append("g").attr("class", "focus").style("display", "none");

  focus
    .append("line")
    .attr("class", "x-hover-line hover-line")
    .attr("y1", 0)
    .attr("y2", HEIGHT);

  focus
    .append("line")
    .attr("class", "-x-hover-line hover-line")
    .attr("y2", -HEIGHT)
    .attr("y1", 0);

  focus
    .append("line")
    .attr("class", "y-hover-line hover-line")
    .attr("x1", 0)
    .attr("x2", WIDTH);

  focus
    .append("line")
    .attr("class", "-y-hover-line hover-line")
    .attr("x2", WIDTH)
    .attr("x1", 0);

  focus.append("circle").attr("r", 7.5);

  // focus.append("text").attr("x", 0).attr("dy", ".31em");

  g.append("rect")
    .attr("class", "overlay")
    .attr("width", WIDTH)
    .attr("height", HEIGHT)
    .on("mouseover", () => focus.style("display", null))
    .on("mouseout", () => focus.style("display", "none"))
    .on("mousemove", mousemove);

  function mousemove() {
    const x0 = x.invert(d3.mouse(this)[0]);
    const i = bisectDate(dataTimeFiltered, x0, 1);
    const d0 = dataTimeFiltered[i - 1];
    const d1 = dataTimeFiltered[i];
    const d = x0 - d0.year > d1.year - x0 ? d1 : d0;
    focus.attr("transform", `translate(${x(d.date)}, ${y(d[yValue])})`);
    // focus.select("text").text(d[yValue]);
    focus.select(".x-hover-line").attr("y2", HEIGHT - y(d[yValue]));
    focus.select(".-x-hover-line").attr("y2", -y(d[yValue]));
    yChangeLabel.style("display", null).attr("y", y(d[yValue])).text(d[yValue]);
    xChangeLabel
      .style("display", null)
      .attr("x", x(d.date))
      .text(formatTime(d.date));
    focus.select(".y-hover-line").attr("x2", -x(d.date));
    focus.select(".-y-hover-line").attr("x2", WIDTH - x(d.date));
  }

  /******************************** Tooltip Code ********************************/

  // Path generator
  let line = d3
    .line()
    .x((d) => x(d.date))
    .y((d) => y(d[yValue]));

  // update line path
  g.select(".line").transition(t).attr("d", line(dataTimeFiltered));

  // Update y-axis label
  const newText =
    yValue === "price_usd"
      ? "Price ($)"
      : yValue === "market_cap"
      ? "Market Capitalization ($)"
      : "24 Hour Trading Volume ($)";
  yLabel.text(newText);
}
