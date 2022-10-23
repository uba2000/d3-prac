/*
 *    main2.js
 *    Omo!!
 *    Project 2 - Candle Stick
 */

let date = (d) => d.date; // given d in data, returns the (temporal) x-value
let open = (d) => d.open; // given d in data, returns a (quantitative) y-value
let close = (d) => d.close; // given d in data, returns a (quantitative) y-value
let high = (d) => d.high; // given d in data, returns a (quantitative) y-value
let low = (d) => d.low; // given d in data, returns a (quantitative) y-value
let title; // given d in data, returns the title text
let marginTop = 20; // top margin, in pixels
let marginRight = 30; // right margin, in pixels
let marginBottom = 30; // bottom margin, in pixels
let marginLeft = 40; // left margin, in pixels
let width = 640; // outer width, in pixels
let height = 400; // outer height, in pixels
let xDomain; // array of x-values (defaults to every weekday)
let xRange = [marginLeft, width - marginRight]; // [left, right]
let xPadding = 0.2;
let xTicks; // array of x-values to label (defaults to every other Monday)
let yType = d3.scaleLinear; // type of y-scale
let yDomain; // [ymin, ymax]
let yRange = [height - marginBottom, marginTop]; // [bottom, top]
let xFormat = "%b %-d"; // a format specifier for the date on the x-axis
let yFormat = "~f"; // a format specifier for the value on the y-axis
let yLabel; // a label for the y-axis
let stroke = "currentColor"; // stroke color for the daily rule
let strokeLinecap = "round"; // stroke line cap for the rules
let colors = ["#4daf4a", "#999999", "#e41a1c"]; // [up, no change, down]

const svg = d3
  .select("#chart-area-2")
  .append("svg")
  .attr("width", width)
  .attr("height", height)
  .attr("viewBox", [0, 0, width, height])
  .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

d3.json("data/chart-data.json").then(function (data) {
  console.log(data, "kkk");
  // Compute values.
  const X = d3.map(data, date);
  const Yo = d3.map(data, open);
  const Yc = d3.map(data, close);
  const Yh = d3.map(data, high);
  const Yl = d3.map(data, low);
  const I = d3.range(X.length);

  const weeks = (start, stop, stride) =>
    d3.utcMonday.every(stride).range(start, +stop + 1);
  const weekdays = (start, stop) =>
    d3
      .utcDays(start, +stop + 1)
      .filter((d) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6);

  // Compute default domains and ticks.
  if (xDomain === undefined) xDomain = weekdays(d3.min(X), d3.max(X));
  if (yDomain === undefined) yDomain = [d3.min(Yl), d3.max(Yh)];
  if (xTicks === undefined) xTicks = weeks(d3.min(xDomain), d3.max(xDomain), 2);

  // Construct scales and axes.
  // If you were to plot a stock using d3.scaleUtc, you’d see distracting gaps
  // every weekend. This chart therefore uses a d3.scaleBand whose domain is every
  // weekday in the dataset. A few gaps remain for holiday weekdays, such as
  // Christmas, but these are infrequent and allow the labeling of Mondays. As a
  // band scale, we specify explicit tick values.
  const xScale = d3.scaleBand(xDomain, xRange).padding(xPadding);
  const yScale = yType(yDomain, yRange);
  const xAxis = d3
    .axisBottom(xScale)
    .tickFormat(d3.utcFormat(xFormat))
    .tickValues(xTicks);
  const yAxis = d3.axisLeft(yScale).ticks(height / 40, yFormat);

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

  svg
    .append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(xAxis)
    .call((g) => g.select(".domain").remove());

  svg
    .append("g")
    .attr("transform", `translate(${marginLeft},0)`)
    .call(yAxis)
    .call((g) => g.select(".domain").remove())
    .call((g) =>
      g
        .selectAll(".tick line")
        .clone()
        .attr("stroke-opacity", 0.2)
        .attr("x2", width - marginLeft - marginRight)
    )
    .call((g) =>
      g
        .append("text")
        .attr("x", -marginLeft)
        .attr("y", 10)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .text(yLabel)
    );

  const g = svg
    .append("g")
    .attr("stroke", stroke)
    .attr("stroke-linecap", strokeLinecap)
    .selectAll("g")
    .data(I)
    .join("g")
    .attr("transform", (i) => `translate(${xScale(X[i])},0)`);

  g.append("line")
    .attr("y1", (i) => yScale(Yl[i]))
    .attr("y2", (i) => yScale(Yh[i]));

  g.append("line")
    .attr("y1", (i) => yScale(Yo[i]))
    .attr("y2", (i) => yScale(Yc[i]))
    .attr("stroke-width", xScale.bandwidth())
    .attr("stroke", (i) => colors[1 + Math.sign(Yo[i] - Yc[i])]);

  if (title) g.append("title").text(title);
});
