(async function draw() {
  const tradeSocket = new WebSocket(
    "wss://stream.binance.com:9443/ws/btcusdt@trade"
  );

  // Data
  let dataset = await d3.json("coins.json");
  console.log(dataset);

  const colors = ["#1ACE37", "#999999", "#FF0F00"]; // [up, no change, down]

  // Accessors
  const xAccessor = (d) => new Date(d.Date);
  const ylAccessor = (d) => d.Low;
  const yhAccessor = (d) => d.High;
  const yoAccessor = (d) => d.Open;
  const ycAccessor = (d) => d.Close;

  // Values
  function calculateAxisValues(data) {
    const xValues = d3.map(data, xAccessor);
    const yoValues = d3.map(data, yoAccessor);
    const ycValues = d3.map(data, ycAccessor);
    const yhValues = d3.map(data, yhAccessor);
    const ylValues = d3.map(data, ylAccessor);
    const IRange = d3.range(xValues.length);

    return { xValues, yoValues, ycValues, yhValues, ylValues, IRange };
  }

  // Scales
  function calculateScale(xValues, { ylValues, yhValues }) {
    let xDomain = d3
      .utcDays(d3.min(xValues), +d3.max(xValues) + 1)
      .filter((d) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6);
    let xScale = d3
      .scaleBand()
      .domain(xDomain)
      .range([dimensions.margin.left, dimensions.ctrWidth]);

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(ylValues), d3.max(yhValues)])
      .range([dimensions.ctrHeight, 0]);

    return { xDomain, xScale, yScale };
  }

  // Draw Candles
  function drawCandle(
    IRange,
    { xValues, xScale, yScale, ylValues, yhValues, yoValues, ycValues }
  ) {
    let candleGroup = ctr
      .selectAll("g")
      .data(IRange)
      .join("g")
      .classed("candle-group", true)
      .attr("transform", (i) => `translate(${xScale(+new Date(xValues[i]))},0)`)
      .attr("stroke", "currentColor")
      .attr("stroke-linecap", "round");

    // Wick
    candleGroup
      .append("line")
      .attr("y1", (i) => yScale(ylValues[i]))
      .attr("y2", (i) => yScale(yhValues[i]));

    // Candle body
    candleGroup
      .append("line")
      .attr("y1", (i) => yScale(yoValues[i]))
      .attr("y2", (i) => yScale(ycValues[i]))
      .attr("stroke-width", 3)
      .attr("stroke", (i) => colors[1 + Math.sign(yoValues[i] - ycValues[i])]);
  }

  //Axis
  function drawAxis({ xScale, xDomain }, { yScale }) {
    let xAxis = d3
      .axisBottom(xScale)
      .tickFormat(d3.utcFormat("%b %-d"))
      .tickValues(
        d3.utcMonday.every(2).range(d3.min(xDomain), +d3.max(xDomain) + 1)
      );
    let xAxisGroup = ctr
      .append("g")
      .call(xAxis)
      .attr("transform", `translate(0, ${dimensions.ctrHeight})`);

    let yAxis = d3.axisLeft(yScale).ticks(dimensions.height / 40, "~f");
    let yAxisGroup = ctr
      .append("g")
      .attr("transform", `translate(${dimensions.margin.left},0)`)
      .call(yAxis)
      .call((g) => g.select(".domain").remove())
      .call(
        (g) =>
          g
            .selectAll(".tick line")
            .clone()
            .attr("stroke-opacity", 0.2)
            .attr("x2", dimensions.ctrWidth) // vertical lines across the chart
      );
  }

  // Values
  const { xValues, yoValues, ycValues, yhValues, ylValues, IRange } =
    calculateAxisValues(dataset);

  // Dimensions
  let dimensions = {
    width: 640,
    height: 400,
    margin: {
      top: 20,
      bottom: 30,
      right: 30,
      left: 50,
    },
  };

  dimensions.ctrWidth =
    dimensions.width - dimensions.margin.left - dimensions.margin.right;
  dimensions.ctrHeight =
    dimensions.height - dimensions.margin.top - dimensions.margin.bottom;

  // Draw image
  const svg = d3
    .select("#chart")
    .append("svg")
    .attr("width", dimensions.width)
    .attr("height", dimensions.height);

  const ctr = svg
    .append("g")
    .attr(
      "transform",
      `translate(${dimensions.margin.left}, ${dimensions.margin.top})`
    );

  // Scales
  const { xDomain, xScale, yScale } = calculateScale(xValues, {
    ylValues,
    yhValues,
  });

  // Draw Candles
  drawCandle(IRange, {
    xValues,
    xScale,
    yScale,
    ylValues,
    yhValues,
    yoValues,
    ycValues,
  });

  //Axis
  drawAxis({ xScale, xDomain }, { yScale });

  function update(updateData) {
    // 1. new data need to be added to 'dataset' then recalculate values
    dataset = [...dataset, updateData];
    const { xValues, yoValues, ycValues, yhValues, ylValues, IRange } =
      calculateAxisValues(dataset);
    // 2. update axis
    const { xDomain, xScale, yScale } = calculateScale(xValues, {
      ylValues,
      yhValues,
    });
    // 3. add candle
    drawCandle(IRange, {
      xValues,
      xScale,
      yScale,
      ylValues,
      yhValues,
      yoValues,
      ycValues,
    });

    drawAxis({ xScale, xDomain }, { yScale });
  }

  setTimeout(() => {
    update({
      Date: "2018-05-15T00:00:00.000Z",
      Open: 184.990005,
      High: 186.220001,
      Low: 183.669998,
      Close: 186.050003,
      "Adj Close": 185.335327,
      Volume: 28402800,
    });
  }, 3000);
})();
