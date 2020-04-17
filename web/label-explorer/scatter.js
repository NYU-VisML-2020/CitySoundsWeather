// Follows the reusable charts pattern: https://bost.ocks.org/mike/chart/
// Grid based on https://observablehq.com/@d3/scatterplot

function scatter() {
  let margin = {
    top: 20,
    bottom: 20,
    left: 40,
    right: 0
  };

  let width = 500 - margin.left - margin.right;
  let height = 500 - margin.top - margin.bottom;

  let label = 'engine';

  let precipitationExtent = [0, 1];
  
  function chart(selection) {
    selection.each(function(nodeData, index) {

      const lightgray = '#dcdcdc';
      
      const node = nodeData.node.slice(10, -6);
      const data = nodeData.values;

      // create scales

      const x = d3.scaleLinear()
          .domain(precipitationExtent).nice()
          .range([0, width]);

      const y = d3.scaleLinear()
          .domain([0, 1])
          .range([height, 0]);
      
      // create axes

      const xAxis = d3.axisBottom(x)
          .ticks(3)
          .tickSize(0);

      const yAxis = d3.axisLeft(y)
          .ticks(3, '%')
          .tickSize(0);

      // set up title, axes, grid.

      const g = d3.select(this)
        .selectAll('.scatter-plot')
        .data([data])
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
              .call(
                group => group.append('g')
                  .attr('class', 'grid')
              )
              .call(
                group => group.append('g')
                  .attr('class', 'circles')
              )
        )
          .attr('class', 'scatter-plot');

      
      g.select('.title')
        .attr('x', width / 2)
        .attr('y', -2)
        .text(node);

      g.select('.background')
        .attr('width', width)
        .attr('height', height)
        .attr('fill', 'white');
         
      g.select('.x.axis')
          .attr('transform', `translate(0, ${height})`)
          .call(xAxis)
          .call(g => g.selectAll('.domain').remove())
      
      g.select('.y.axis')
          .call(yAxis)
          .call(g => g.selectAll('.domain').remove())

      if (index === 0) {
        g.select('.x.axis')
          .select('.axis-label')
            .attr('x', width / 2)
            .attr('y', 15)
            .attr('text-anchor', 'middle')
            .attr('dominant-baseline', 'hanging')
            .attr('fill', 'black')
            .text('precipitation (mm)');

        g.select('.y.axis')
          .select('.axis-label')
            .attr('dominant-baseline', 'central')
            .attr('text-anchor', 'middle')
            .attr('x', -35)
            .attr('y', height / 2)
            .attr('transform', `rotate(-90, ${-35}, ${height / 2})`)
            .attr('fill', 'black')
            .text('probability');
      }


      const grid = g.select('.grid');

      grid.selectAll('.y-grid-line')
        .data(y.ticks())
        .join('line')
          .attr('class', 'y-grid-line')
          .attr('stroke', lightgray)
          .attr('x1', 0)
          .attr('x2', width)
          .attr('y1', d => 0.5 + y(d))
          .attr('y2', d => 0.5 + y(d));

      grid.selectAll('.x-grid-line')
        .data(x.ticks())
        .join('line')
          .attr('class', 'x-grid-line')
          .attr('stroke', lightgray)
          .attr('x1', d => 0.5 + x(d))
          .attr('x2', d => 0.5 + x(d))
          .attr('y1', d => 0)
          .attr('y2', d => height);

      // draw points

      g.select('.circles')
        .selectAll('circle')
        .data(data)
        .join('circle')
          .attr('cx', d => x(d['precipitation[mm]']))
          .attr('cy', d => y(d[label]))
          .attr('fill', 'steelblue')
          .attr('opacity', 0.75)
          .attr('r', 2);
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

  chart.label = function(l) {
    if (!arguments.length) return label;
    label = l;
    return chart;
  }

  chart.precipitationExtent = function(p) {
    if (!arguments.length) return precitationExtent;
    precipitationExtent = p;
    return chart;
  }

  return chart;
}

