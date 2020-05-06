// References:
// Follows the reusable charts pattern: https://bost.ocks.org/mike/chart/
// https://observablehq.com/@d3/histogram
// https://observablehq.com/@d3/d3-bin
// https://github.com/d3/d3-array#bins

function histogram() {
  let margin = {
    top: 20,
    bottom: 20,
    left: 20,
    right: 20
  };

  let width = 500 - margin.left - margin.right;
  let height = 500 - margin.top - margin.bottom;
  let x = d3.scaleLinear();
  let globalYMax = 0;
  let color;
  
  function chart(selection) {
    selection.each(function(nodeData, index) {
      // constants

      const precip = 'precipitation[mm]'; 
      const lightgray = '#dcdcdc';
      const innerMargin = { top: 5, bottom: 5 };
      
      // data preparation
      const combined = nodeData.bins;
      
      const types = combined.map(d => d.type);

      const yMax = globalYMax ?
        globalYMax :
        d3.max(combined, c => d3.max(c.data, d => d.length));

      // create scales

      const grid = d3.scaleBand()
          .domain(types)
          .range([0, height])
          .paddingInner(0);

      const chartHeight = grid.bandwidth() - innerMargin.top - innerMargin.bottom;
      
      const y = d3.scaleLinear()
          .domain([0, yMax])
          .range([chartHeight, 0]);

      
      x.range([0, width]);
      
      // create axes

      const xAxis = d3.axisBottom(x)
          .ticks(5);

      const yAxis = d3.axisLeft(y)
          .ticks(3, '~s');

      // one time set up

      const g = d3.select(this)
        .selectAll('.histograms')
        .data([combined])
        .join(
          enter => enter.append('g')
              .call(
                group => group.append('rect')
                    .attr('class', 'background')
              )
              .call(
                group => group.append('text')
                    .attr('class', 'title')
              )
              .call(
                group => group.append('g')
                    .attr('class', 'charts')
              )
        )
          .attr('class', 'histograms hover-area')
          .attr('transform', `translate(${margin.left}, ${margin.top})`);

      g.select('.title')
        .attr('x', width / 2)
        .attr('y', 0)
        .text(nodeData.key);

      g.select('.background')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'white');

      // add groups for both charts

      const charts = g.select('.charts')
        .selectAll('.chart')
        .data(d => d)
        .join(
          enter => enter.append('g')
              .call(
                group => group.append('g')
                  .attr('class', 'x axis')
                .append('text')
                  .attr('class', 'axis-label')
              )
              .call(
                group => group.append('g')
                  .attr('class', 'y axis')
                .append('text')
                  .attr('class', 'axis-label')
              )
        )
          .attr('class', 'chart')
          .attr('fill', d => color(d.type))
          .attr('transform', d => `translate(0, ${grid(d.type) + innerMargin.top})`);
      
      const bottomChart = charts.filter((d, i) => i === 1);

      bottomChart.select('.x.axis')
          .attr('transform', `translate(0, ${chartHeight})`)
          .call(xAxis)
          .call(g => g.selectAll('.domain').remove())
      
      charts.select('.y.axis')
          .call(yAxis)
          .call(g => g.selectAll('.domain').remove())

      // add axis labels to first charts

      if (index === 0) {
        bottomChart.select('.x.axis')
          .select('.axis-label')
            .attr('x', width / 2)
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'hanging')
            .attr('fill', 'black')
            .text('label probability');

        charts.select('.y.axis')
          .select('.axis-label')
            .attr('dominant-baseline', 'central')
            .attr('text-anchor', 'middle')
            .attr('x', -35)
            .attr('y', chartHeight / 2)
            .attr('transform', `rotate(-90, ${-35}, ${chartHeight / 2})`)
            .attr('fill', 'black')
            .text(d => d.type);
      }

      // draw bars

      charts.selectAll('rect')
        .data(d => d.data)
        .join('rect')
          .attr('x', d => x(d.x0))
          .attr('y', d => y(d.length))
          .attr('width', d => x(d.x1) - x(d.x0))
          .attr('height', d => chartHeight - y(d.length));
    });
  }

  chart.width = function(w) {
    if (!arguments.length) return width;
    width = w - margin.left - margin.right;
    return chart;
  }

  chart.height = function(h) {
    if (!arguments.length) return height;
    height = h - margin.top - margin.bottom;
    return chart;
  }

  chart.x = function(ex) {
    if (!arguments.length) return x;
    x = ex;
    return chart;
  }
  
  chart.yMax = function(yM) {
    if (!arguments.length) return yMax;
    globalYMax = yM;
    return chart;
  }
  
  chart.color = function(c) {
    if (!arguments.length) return color;
    color = c;
    return chart;
  }

  return chart;
}

