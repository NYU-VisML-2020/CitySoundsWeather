d3.csv('data/predictions.csv', d3.autoType).then(dataset => {
  manager(dataset);
});


function manager(dataset) {
  const { data, numRows, numCols } = prepareData(dataset);

  const labels = dataset.columns.slice(3);
  let label = labels[0];
  
  let rainExtent = d3.extent(dataset, d => d['precipitation[mm]']);

  const div = d3.select('#vis');
  const svg = div.append('svg')
      .attr('id', 'charts');

  const chart = scatter();

  setUpLabelSelect();

  setUpResize();

  drawCharts();


  function prepareData(dataset) {
    const byNode = Array.from(d3.group(dataset, d => d.node),
                                  ([node, values]) => ({node, values}));

    const numNodes = byNode.length;
    const numRows = Math.ceil(Math.sqrt(numNodes));
    const numCols = numRows;

    const gridPositions = d3.cross(d3.range(numRows), d3.range(numCols),
                                   (row, col) => ({row, col}));

    const data = d3.zip(byNode, gridPositions)
        .map(([data, position]) => ({...data, ...position}));

    return {data, numRows, numCols};
  }


  function setUpLabelSelect() {
    const labelSelect = d3.select('#label-select');

    labelSelect.selectAll('option')
      .data(labels)
      .join('option')
        .attr('value', d => d)
        .text(d => d);

    labelSelect.on('change', function() {
      label = this.value;
      drawCharts();
    })
  }

  function setUpResize() {
    window.addEventListener('resize', function(e) {
      drawCharts();
    })
  }


  function drawCharts() {
    const width = div.node().clientWidth;
    const height = div.node().clientHeight;

    const  margin = {
      top: 20,
      bottom: 20,
      left: 50,
      right: 20
    };

    const column = d3.scaleBand()
        .domain(d3.range(numCols))
        .range([margin.left, width - margin.right]);

    const row = d3.scaleBand()
        .domain(d3.range(numRows))
        .range([margin.top, height - margin.bottom]);

    chart.width(column.bandwidth())
      .height(row.bandwidth())
      .label(label)
      .precipitationExtent(rainExtent);
    
    const groups = svg.selectAll('.cell')
      .data(data)
      .join('g')
        .attr('transform', d => `translate(${column(d.col)}, ${row(d.row)})`)
        .attr('class', 'cell')
      .call(chart);
  }
}
