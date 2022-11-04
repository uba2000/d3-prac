function wrap(text, width) {
  text.each(function () {
    let text = d3.select(this);
    let words = text.text().split(/\s+/).reverse();
    let word,
      line = [],
      lineNumber = 0,
      lineHeight = 1.1,
      y = text.attr("y"),
      dy = parseFloat(text.attr("dy")),
      tspan = text
        .text(null)
        .append("tspan")
        .attr("x", 0)
        .attr("y", y)
        .attr("dy", dy + "em");
    while ((word = words.pop())) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text
          .append("tspan")
          .attr("x", 0)
          .attr("y", y)
          .attr("dy", ++lineNumber * lineHeight + dy + "em")
          .text(word);
      }
    }
  });
}

(async function draw() {
  function formatHistoryData(data) {
    return data.map((d) => {
      return {
        Date: d[0],
        Open: d[1],
        High: d[2],
        Low: d[3],
        Close: d[4],
      };
    });
  }

  let interval = "1m";
  let intervalNumber = Number(interval.split(/m|h|d|s/)[0]);

  var binanceSocket = new WebSocket(
    `wss://stream.binance.com:9443/ws/btcusdt@kline_${interval}`
  );

  // Data
  let dataset = formatHistoryData(await d3.json(`history-${interval}.json`));
  // get historical data then continue with chart drawing...
  // let dataset = [];
  // console.log(dataset);

  const colors = ["#1ACE37", "#999999", "#FF0F00"]; // [up, no change, down]

  // Accessors
  const xAccessor = (d) => new Date(d.Date);
  const ylAccessor = (d) => d.Low;
  const yhAccessor = (d) => d.High;
  const yoAccessor = (d) => d.Open;
  const ycAccessor = (d) => d.Close;

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

  // Interval Functions
  const intervalFunctions = {
    // Remove seconds or minutes for days on weekends...
    "1s": (start, stop) => d3.utcSeconds(start, +stop + 1), // 1 minute
    "1m": (start, stop) => d3.utcMinutes(start, +stop + 1), // 1 minute
    "5m": (start, stop) => d3.utcMinutes(start, +stop + 1), // 5 minutes
    "1d": (start, stop) =>
      d3
        .utcDays(start, +stop + 1)
        .filter((d) => d.getUTCDay() !== 0 && d.getUTCDay() !== 6), // 1 day
  };

  // Interval x-axis ticks
  const intervalTickXValues = {
    "1s": (start, stop) => d3.utcSecond.every(30).range(start, +stop + 1),
    "1m": (start, stop) => d3.utcMinute.every(30).range(start, +stop + 1),
    "5m": (start, stop) => d3.utcMinute.every(1).range(start, +stop + 1),
    "1d": (start, stop) => d3.utcMonday.every(1).range(start, +stop + 1),
  };

  // Interval x-axis formats
  const intervalFormats = {
    "1s": d3.utcFormat("%-H:%M:%S"),
    "1m": d3.utcFormat("%-H:%M:%S"),
    "5m": d3.utcFormat("%b %-d"),
    "1d": d3.utcFormat("%b %-d"),
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
    // let xDomain = intervalFunctions[interval](d3.min(xValues), d3.max(xValues));
    let xDomain = d3.range(-1, xValues.length);
    // let xRange = [dimensions.margin.left, dimensions.ctrWidth];
    let xRange = [0, dimensions.ctrWidth];
    let xLinearScale = d3
      .scaleLinear()
      .domain([-1, xValues.length])
      .range([0, dimensions.ctrWidth]);
    let xScale = d3.scaleBand().domain(xDomain).range(xRange).padding(0.3);
    let xDateScale = d3
      .scaleQuantize()
      .domain([0, xValues.length])
      .range(xValues);

    const yScale = d3
      .scaleLinear()
      .domain([d3.min(ylValues), d3.max(yhValues)])
      .range([dimensions.ctrHeight, 0])
      .nice();

    return { xDomain, xLinearScale, xScale, yScale, xDateScale };
  }

  // Draw Candles
  function drawCandle(
    IRange,
    {
      xValues,
      xScale,
      xLinearScale,
      yScale,
      ylValues,
      yhValues,
      yoValues,
      ycValues,
    }
  ) {
    let chartBody = ctr
      .append("g")
      .attr("class", "chartBody")
      .attr("clip-path", "url(#clip)");

    let candleGroup = chartBody
      .selectAll("g.candle-group")
      .data(IRange)
      .join("g")
      .classed("candle-group", true)
      // .attr("transform", (i) => `translate(${xScale(new Date(xValues[i]))},0)`)
      .attr("stroke", "currentColor");
    // .attr("stroke-linecap", "round");

    // remove previous candle groups
    candleGroup.select("line.wick").remove();
    candleGroup.select("line.body").remove();
    // ctr.select('defs').remove();

    // Wick
    // with 'line'...
    // const wicks = candleGroup
    //   .append("line")
    //   .attr("y1", (i) => yScale(ylValues[i]))
    //   .attr("y2", (i) => yScale(yhValues[i]))
    //   .attr("class", "candle-wick");

    const wicks = candleGroup
      .append("line")
      .attr("class", "candle-wick")
      .attr("x1", (d, i) => xLinearScale(i) - xScale.bandwidth() / 2)
      .attr("x2", (d, i) => xLinearScale(i) - xScale.bandwidth() / 2)
      .attr("y1", (d) => yScale(yhValues[d]))
      .attr("y2", (d) => yScale(ylValues[d]));
    // .attr("stroke", (i) => colors[1 + Math.sign(yoValues[i] - ycValues[i])]);

    // Candle body
    // with 'line'...
    // const candles = candleGroup
    //   .append("line")
    //   .attr("y1", (i) => yScale(yoValues[i]))
    //   .attr("y2", (i) => yScale(ycValues[i]))
    //   .attr("stroke-width", xScale.bandwidth())
    //   .attr("class", "candle-body")
    //   .attr("stroke", (i) => colors[1 + Math.sign(yoValues[i] - ycValues[i])]);
    // with 'rect'...
    const candles = candleGroup
      .append("rect")
      .attr("x", (d, i) => xLinearScale(i) - xScale.bandwidth())
      .attr("class", "candle-body")
      .attr("y", (d) => yScale(Math.max(yoValues[d], ycValues[d])))
      .attr("width", xScale.bandwidth())
      .attr("height", (d) =>
        yoValues[d] === ycValues[d]
          ? 1
          : yScale(Math.min(yoValues[d], ycValues[d])) -
            yScale(Math.max(yoValues[d], ycValues[d]))
      )
      .attr("fill", (i) => colors[1 + Math.sign(yoValues[i] - ycValues[i])])
      .attr("stroke", "transparent");

    ctr
      .append("defs")
      .append("clipPath")
      .attr("id", "clip")
      .append("rect")
      .attr("width", dimensions.ctrWidth)
      .attr("height", dimensions.ctrHeight);

    return { candleGroup, wicks, candles };
  }

  //Axis
  function drawAxis({ xScale, xLinearScale, xDomain }, { yScale }) {
    let xAxis = d3
      .axisBottom(xLinearScale)
      .tickFormat(intervalFormats[interval])
      .tickValues(
        intervalTickXValues[interval](d3.min(xDomain), d3.max(xDomain))
      );
    let xAxisGroup = ctr
      .append("g")
      .attr("class", "xAxis")
      .attr("transform", `translate(0, ${dimensions.ctrHeight})`)
      .call(xAxis)
      .call((g) => g.select(".domain").remove());

    xAxisGroup.selectAll(".tick text").call(wrap, xScale.bandwidth());

    let yAxis = d3.axisLeft(yScale).ticks(dimensions.height / 40, "~f");
    let yAxisGroup = ctr
      .append("g")
      .attr("class", "yAxis")
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

    return { xAxisGroup, yAxisGroup };
  }

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

  const clipPath = ctr
    .append("rect")
    .attr("id", "rect")
    .attr("width", dimensions.ctrWidth)
    .attr("height", dimensions.ctrHeight)
    .style("fill", "none")
    .style("pointer-events", "all")
    .attr("clip-path", "url(#clip)");

  // Values
  const { xValues, yoValues, ycValues, yhValues, ylValues, IRange } =
    calculateAxisValues(dataset);

  if (dataset.length !== 0) {
    // Scales
    const { xDomain, xScale, xLinearScale, yScale, xDateScale } =
      calculateScale(xValues, {
        ylValues,
        yhValues,
      });

    //Axis
    const { xAxisGroup, yAxisGroup } = drawAxis(
      { xScale, xLinearScale, xDomain },
      { yScale }
    );

    // Draw Candles
    const { candleGroup, candles, wicks } = drawCandle(IRange, {
      xValues,
      xScale,
      xLinearScale,
      yScale,
      ylValues,
      yhValues,
      yoValues,
      ycValues,
    });

    // Scrollable
    const extent = [
      [0, 0],
      [dimensions.ctrWidth, dimensions.ctrHeight],
    ];
    let resizeTimer;
    let zoom = d3
      .zoom()
      .scaleExtent([1, 100])
      .translateExtent(extent)
      .on("zoom", zoomed)
      .on("zoom.end", zoomend);

    svg.call(zoom);

    function zoomed(event) {
      console.log("zoomed");
      // debugger;
      let t = d3.zoomTransform(this);
      // let t = event.transform;
      let xScaleZ = t.rescaleX(xLinearScale);

      let hideTicksWithoutLabel = () => {
        d3.selectAll(".xAxis .tick text").each(function (d) {
          if (this.innerHTML === "") {
            this.parentNode.style.display = "none";
          }
        });
      };

      xAxisGroup
        .call(
          d3
            .axisBottom(xScale)
            .tickFormat(intervalFormats[interval])
            .tickValues(
              intervalTickXValues[interval](d3.min(xDomain), d3.max(xDomain))
            )
        )
        .call((g) => g.select(".domain").remove());
      // debugger;
      candles
        .attr("x", (d, i) => xScaleZ(i) - (xScale.bandwidth() * t.k) / 2)
        .attr("width", xScale.bandwidth() * t.k);

      wicks.attr(
        "x1",
        (d, i) => xScaleZ(i) - xScale.bandwidth() / 2 + xScale.bandwidth() * 0.5
      );
      wicks.attr(
        "x2",
        (d, i) => xScaleZ(i) - xScale.bandwidth() / 2 + xScale.bandwidth() * 0.5
      );

      hideTicksWithoutLabel();

      xAxisGroup.selectAll(".tick text").call(wrap, xScale.bandwidth());
    }

    function zoomend(event) {
      console.log("zoomend");
      let t = d3.zoomTransform(this);
      // let t = event.transform;
      let xScaleZ = t.rescaleX(xLinearScale);
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        let xmin = new Date(xDateScale(Math.floor(xScaleZ.domain()[0])));
        let xmax = new Date(xDateScale(Math.floor(xScaleZ.domain()[1])));
        let filtered = dataset.filter((d) => d.Date >= xmin && d.Date <= xmax);
        minP = +d3.min(filtered, ylAccessor);
        maxP = +d3.max(filtered, yhAccessor);
        buffer = Math.floor((maxP - minP) * 0.1);

        yScale.domain([minP - buffer, maxP + buffer]);
        candles
          .transition()
          .duration(800)
          .attr("y", (d) => yScale(Math.max(yoValues[d], ycValues[d])))
          .attr("height", (d) =>
            yoValues[d] === ycValues[d]
              ? 1
              : yScale(Math.min(yoValues[d], ycValues[d])) -
                yScale(Math.max(yoValues[d], ycValues[d]))
          );

        wicks
          .transition()
          .duration(800)
          .attr("y1", (d) => yScale(yhValues[d]))
          .attr("y2", (d) => yScale(ylValues[d]));

        yAxisGroup
          .transition()
          .duration(800)
          .call(d3.axisLeft(yScale).ticks(dimensions.height / 40, "~f"))
          .call((g) => g.select(".domain").remove());
      }, 500);
    }
  }

  function update(updateData) {
    if (updateData.Date % intervalNumber === 0) {
      // update data of same time
      dataset = dataset.filter((d) => d.Date !== updateData.Date);
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
  }

  // binanceSocket.onmessage = function (event) {
  //   var message = JSON.parse(event.data);

  //   var candlestick = message.k;

  //   update({
  //     Date: candlestick.t,
  //     Open: candlestick.o,
  //     High: candlestick.h,
  //     Low: candlestick.l,
  //     Close: candlestick.c,
  //   });
  // };
})();

// axios
//   .get("http://localhost:5500/get-data", { mode: "no-cors" })
//   .then(function (response) {
//     // handle success
//     console.log(response);
//   })
//   .catch(function (error) {
//     // handle error
//     console.log(error);
//   })
//   .finally(function () {
//     // always executed
//   });
