/*
 * main.js
 * Practicing Candlestick chart with D3.js
 * Roqqu - Noel
 */

let dataArray = [
  {
    t: 1666569600000, // time
    T: 1666655999999,
    s: "BTCUSDT",
    i: "1d",
    f: 2012576760,
    L: 2017488703,
    o: "19570.40000000", // open
    c: "19364.59000000", // close
    h: "19601.15000000", // high
    l: "19157.00000000", // low
    v: "226422.93057000",
    n: 4911944,
    x: false,
    q: "4381434720.60253880",
    V: "111751.05056000",
    Q: "2162530172.92424680",
    B: "0",
  },
];

/** INITIAL CONFIG BEGIN */
let date = (d) => d.t; // given d in data, returns the (temporal) x-value
let open = (d) => d.o; // given d in data, returns a (quantitative) y-value
let close = (d) => d.c; // given d in data, returns a (quantitative) y-value
let high = (d) => d.h; // given d in data, returns a (quantitative) y-value
let low = (d) => d.l; // given d in data, returns a (quantitative) y-value

const MARGIN = { LEFT: 40, RIGHT: 30, TOP: 20, BOTTOM: 30 };
const WIDTH = 640;
const HEIGHT = 400;

let xDomain; // array of x-values (defaults to every weekday)
let xRange = [MARGIN.LEFT, WIDTH - MARGIN.RIGHT]; // [left, right]
let xPadding = 0.2;
let xTicks; // array of x-values to label (defaults to every other Monday)
let yType = d3.scaleLinear; // type of y-scale
let yDomain; // [ymin, ymax]
let yRange = [HEIGHT - MARGIN.BOTTOM, MARGIN.TOP]; // [bottom, top]
let xFormat = "%b %-d"; // a format specifier for the date on the x-axis
let yFormat = "~f"; // a format specifier for the value on the y-axis
let yLabel = "Price ($)"; // a label for the y-axis
let stroke = "currentColor"; // stroke color for the daily rule
let strokeLinecap = "round"; // stroke line cap for the rules
let colors = ["#1ACE37", "#999999", "#FF0F00"]; // [up, no change, down]
let title; // given d in data, returns the title text
/** INITIAL CONFIG END */

// for tooltip
const bisectDate = d3.bisector(date).left;

const svg = d3
  .select("#chart-area")
  .append("svg")
  .attr("width", WIDTH)
  .attr("height", HEIGHT)
  .attr("viewBox", [0, 0, WIDTH, HEIGHT])
  .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

svg.append("g").attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`);

var binanceSocket = new WebSocket(
  `wss://stream.binance.com:9443/ws/btcusdt@kline_1d`
);

const xAxisCall = d3.axisBottom();
const yAxisCall = d3.axisLeft();

const xScale = d3.scaleBand().range(xRange);
const yScale = yType().range(yRange);

const xAxis = svg
  .append("g")
  .attr("transform", `translate(0,${HEIGHT - MARGIN.BOTTOM})`);
const yAxis = svg.append("g").attr("transform", `translate(${MARGIN.LEFT},0)`);

svg
  .append("text")
  .attr("x", MARGIN.LEFT + 5)
  .attr("y", 10)
  .attr("fill", "currentColor")
  .attr("font-size", "10")
  .attr("text-anchor", "end")
  .text(yLabel);

// Compute values.
let X = d3.map(dataArray, date);
let Yo = d3.map(dataArray, open);
let Yc = d3.map(dataArray, close);
let Yh = d3.map(dataArray, high);
let Yl = d3.map(dataArray, low);
let I = d3.range(X.length);
console.log(X);

const weeks = (start, stop, stride) =>
  d3.utcMonday.every(stride).range(start, +stop + 1);
const weekdays = (start, stop) =>
  d3
    .utcDays(start, +stop + 1)
    .filter((d) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6);

// Compute default domains and ticks.
if (xDomain === undefined)
  xDomain = weekdays(new Date(d3.min(X)), new Date(d3.max(X)));
if (yDomain === undefined) yDomain = [d3.min(Yl), d3.max(Yh)];
if (xTicks === undefined) xTicks = weeks(d3.min(xDomain), d3.max(xDomain), 2);

// Construct scales and axes.
xScale.domain(xDomain).padding(xPadding);
yScale.domain(yDomain);

// Compute titles.
if (title === undefined) {
  const formatDate = d3.utcFormat("%B %-d, %Y");
  const formatValue = d3.format(".2f");
  const formatChange = (
    (f) => (y0, y1) =>
      f((y1 - y0) / y0)
  )(d3.format("+.2%"));
  title = (i) => `${formatDate(X[i])}
      Open: ${formatValue(Yo[i])}
      Close: ${formatValue(Yc[i])} (${formatChange(Yo[i], Yc[i])})
      Low: ${formatValue(Yl[i])}
      High: ${formatValue(Yh[i])}`;
} else if (title !== null) {
  const T = d3.map(data, title);
  title = (i) => T[i];
}

xAxis
  .call(
    xAxisCall.scale(xScale).tickFormat(d3.utcFormat(xFormat)).tickValues(xTicks)
  )
  .call((g) => g.select(".domain").remove()); // remove axis line

yAxis
  .call(yAxisCall.scale(yScale).ticks(HEIGHT / 40, yFormat))
  .call((g) => g.select(".domain").remove())
  .call(
    (g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("stroke-opacity", 0.2)
        .attr("x2", WIDTH - MARGIN.LEFT - MARGIN.RIGHT) // vertical lines across the chart
  );

update(dataArray);

// binanceSocket.onmessage = function (event) {
//   var message = JSON.parse(event.data);

//   var candlestick = message.k;
//   // save to history...
//   dataArray = [...dataArray, candlestick];

//   // run visualization
//   update(dataArray);
// };

// Get initial data to update
// binanceSocket.onmessage = function (event) {
// var message = JSON.parse(event.data);
// // console.log(message);

// var candlestick = message.k;
// console.log(candlestick);
// // save to history...
// dataArray = [...dataArray, candlestick];
// console.log(dataArray);

// // run visualization
// update(dataArray);
// };

// d3.json("data/aapl.json").then((data) => {
//   dataArray = [
//     {
//       t: 1666569600000, // time
//       T: 1666655999999,
//       s: "BTCUSDT",
//       i: "1d",
//       f: 2012576760,
//       L: 2017488703,
//       o: "19570.40000000", // open
//       c: "19364.59000000", // close
//       h: "19601.15000000", // high
//       l: "19157.00000000", // low
//       v: "226422.93057000",
//       n: 4911944,
//       x: false,
//       q: "4381434720.60253880",
//       V: "111751.05056000",
//       Q: "2162530172.92424680",
//       B: "0",
//     },
//   ];
//   // run visualization
//   update(dataArray);
// });

function update(data) {
  X = d3.map(data, date);
  Yo = d3.map(data, open);
  Yc = d3.map(data, close);
  Yh = d3.map(data, high);
  Yl = d3.map(data, low);
  I = d3.range(X.length);

  xDomain = weekdays(new Date(d3.min(X)), new Date(d3.max(X)));
  xScale.domain(xDomain).padding(xPadding);
  xTicks = weeks(d3.min(xDomain), d3.max(xDomain), 2);

  yDomain = [d3.min(Yl), d3.max(Yh)];
  yScale.domain(yDomain);

  xAxis.call(
    xAxisCall.scale(xScale).tickFormat(d3.utcFormat(xFormat)).tickValues(xTicks)
  );
  yAxis.call(yAxisCall.scale(yScale).ticks(HEIGHT / 40, yFormat));

  // This part can be rerendered
  const g = svg
    .append("g")
    .attr("stroke", stroke)
    .attr("stroke-linecap", strokeLinecap)
    .selectAll("g")
    .data(I)
    .join("g")
    .attr("transform", (i) => `translate(${xScale(new Date(X[i]))},0)`);

  g.append("line")
    .attr("y1", (i) => yScale(Yl[i]))
    .attr("y2", (i) => yScale(Yh[i]));

  g.append("line")
    .attr("y1", (i) => yScale(Yo[i]))
    .attr("y2", (i) => yScale(Yc[i]))
    .attr("stroke-width", 3)
    .attr("stroke", (i) => colors[1 + Math.sign(Yo[i] - Yc[i])]);

  if (title) g.append("title").text(title);

  /******************************** Tooltip Code ********************************/

  // const focus = svg
  //   .append("g")
  //   .attr("class", "hover-candle")
  //   .style("display", "none");

  // focus
  //   .append("line")
  //   .attr("class", "x-hover-line hover-line")
  //   .attr("y1", 0)
  //   .attr("y2", HEIGHT);

  // focus
  //   .append("line")
  //   .attr("class", "-x-hover-line hover-line")
  //   .attr("y2", -HEIGHT)
  //   .attr("y1", 0);

  // focus
  //   .append("line")
  //   .attr("class", "y-hover-line hover-line")
  //   .attr("x1", 0)
  //   .attr("x2", WIDTH);

  // focus
  //   .append("line")
  //   .attr("class", "-y-hover-line hover-line")
  //   .attr("x2", WIDTH)
  //   .attr("x1", 0);

  // svg
  //   .append("rect")
  //   .attr("class", "overlay")
  //   .attr("width", WIDTH)
  //   .attr("height", HEIGHT)
  //   .on("mouseover", () => focus.style("display", null))
  //   .on("mouseout", () => focus.style("display", "none"))
  //   .on("mousemove", mousemove);

  // function mousemove(e) {
  //   const x0 = xScale(d3.pointer(e)[0]);
  //   const i = bisectDate(data, x0, 1);
  //   const d0 = data[i - 1];
  //   const d1 = data[i];
  //   const d = x0 - d0?.date > d1?.date - x0 ? d1 : d0;
  //   focus.attr(
  //     "transform",
  //     `translate(${xScale(new Date(d.Date))}, ${yScale(d.High)})`
  //   );
  //   // focus.select("text").text(d[yValue]);
  //   focus.select(".x-hover-line").attr("y2", HEIGHT - yScale(d.High));
  //   focus.select(".-x-hover-line").attr("y2", -yScale(d.High));
  //   // yChangeLabel.style("display", null).attr("y", yScale(d.High)).text(d.High);
  //   // xChangeLabel
  //   //   .style("display", null)
  //   //   .attr("x", xScale(d.date))
  //   //   .text(formatTime(d.date));
  //   focus.select(".y-hover-line").attr("x2", -xScale(new Date(d.Date)));
  //   focus.select(".-y-hover-line").attr("x2", WIDTH - xScale(new Date(d.Date)));
  // }

  /******************************** Tooltip Code ********************************/
}
