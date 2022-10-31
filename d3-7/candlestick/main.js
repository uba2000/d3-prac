(async function draw() {
  let interval = "1s";
  let intervalNumber = Number(interval.split(/m|h|d|s/)[0]);

  var binanceSocket = new WebSocket(
    `wss://stream.binance.com:9443/ws/btcusdt@kline_${interval}`
  );

  // Data
  // let dataset = await d3.json("coins.json");
  let dataset = [];
  // console.log(dataset);

  const colors = ["#1ACE37", "#999999", "#FF0F00"]; // [up, no change, down]

  // Accessors
  const xAccessor = (d) => new Date(d.Date);
  const ylAccessor = (d) => d.Low;
  const yhAccessor = (d) => d.High;
  const yoAccessor = (d) => d.Open;
  const ycAccessor = (d) => d.Close;

  // Interval Functions
  const intervalFunctions = {
    // Remove seconds or minutes for days on weekends...
    "1s": (start, stop) => d3.utcSeconds(start, +stop + 1), // 1 minute
    "5m": (start, stop) => d3.utcMinutes(start, +stop + 1), // 5 minutes
    "1d": (start, stop) =>
      d3
        .utcDays(start, +stop + 1)
        .filter((d) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6), // 1 day
  };

  // Interval x-axis ticks
  const intervalTickXValues = {
    "1s": (start, stop) => d3.utcMonday.every(1).range(start, +stop + 1),
    "5m": (start, stop) => d3.utcMonday.every(1).range(start, +stop + 1),
    "1d": (start, stop) => d3.utcMonday.every(1).range(start, +stop + 1),
  };

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
    let xDomain = intervalFunctions[interval](d3.min(xValues), d3.max(xValues));
    let xScale = d3
      .scaleBand()
      .domain(xDomain)
      .range([dimensions.margin.left + 10, dimensions.ctrWidth]);

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
      .attr("transform", (i) => `translate(${xScale(new Date(xValues[i]))},0)`)
      .attr("stroke", "currentColor")
      .attr("stroke-linecap", "round");

    // remove previous candle groups
    candleGroup.select("line.wick").remove();
    candleGroup.select("line.body").remove();

    // Wick
    candleGroup
      .append("line")
      .attr("y1", (i) => yScale(ylValues[i]))
      .attr("y2", (i) => yScale(yhValues[i]))
      .attr("class", "wick");

    // Candle body
    candleGroup
      .append("line")
      .attr("y1", (i) => yScale(yoValues[i]))
      .attr("y2", (i) => yScale(ycValues[i]))
      // .attr("stroke-width", xScale.bandwidth())
      .attr("stroke-width", 3)
      .attr("class", "body")
      .attr("stroke", (i) => colors[1 + Math.sign(yoValues[i] - ycValues[i])]);
  }

  //Axis
  function drawAxis({ xScale, xDomain }, { yScale }) {
    let xAxis = d3
      .axisBottom(xScale)
      .tickFormat(d3.utcFormat("%b %-d"))
      .tickValues(
        intervalTickXValues[interval](d3.min(xDomain), d3.max(xDomain))
      );
    let xAxisGroup = ctr
      .append("g")
      .call(xAxis)
      .call((g) => g.select(".domain").remove())
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

  if (dataset.length !== 0) {
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
  }

  function update(updateData) {
    if (updateData.Date % intervalNumber === 0) {
      // 1. new data need to be added to 'dataset' then recalculate values
      // dataset = dataset.filter((d) => d.Date !== updateData.Date);
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
  }

  binanceSocket.onmessage = function (event) {
    var message = JSON.parse(event.data);

    var candlestick = message.k;

    // console.log(candlestick);

    update({
      Date: candlestick.t,
      Open: candlestick.o,
      High: candlestick.h,
      Low: candlestick.l,
      Close: candlestick.c,
    });
  };

  // setTimeout(() => {
  //   update({
  //     Date: "2018-05-15T00:00:00.000Z",
  //     Open: 184.990005,
  //     High: 186.220001,
  //     Low: 183.669998,
  //     Close: 186.050003,
  //     "Adj Close": 185.335327,
  //     Volume: 28402800,
  //   });
  // }, 3000);

  // setTimeout(() => {
  //   update({
  //     Date: "2018-05-15T00:00:00.000Z",
  //     Open: 185.179993,
  //     High: 187.669998,
  //     Low: 184.75,
  //     Close: 185.160004,
  //     "Adj Close": 184.448746,
  //     Volume: 42451400,
  //   });
  // }, 6000);

  // setTimeout(() => {
  //   update({
  //     Date: "2018-05-16T00:00:00.000Z",
  //     Open: 175.880005,
  //     High: 177.5,
  //     Low: 174.440002,
  //     Close: 176.889999,
  //     "Adj Close": 176.21051,
  //     Volume: 34068200,
  //   });
  // }, 9000);

  // setTimeout(() => {
  //   update({
  //     Date: "2018-05-17T00:00:00.000Z",
  //     Open: 175.229996,
  //     High: 177.75,
  //     Low: 173.800003,
  //     Close: 176.570007,
  //     "Adj Close": 175.891754,
  //     Volume: 66539400,
  //   });
  // }, 12000);

  // setTimeout(() => {
  //   update({
  //     Date: "2018-05-20T00:00:00.000Z",
  //     Open: 175.229996,
  //     High: 177.75,
  //     Low: 173.800003,
  //     Close: 176.570007,
  //     "Adj Close": 175.891754,
  //     Volume: 66539400,
  //   });
  // }, 15000);
})();
