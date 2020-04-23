d3.csv('data/predictions-train.csv', d3.autoType).then(dataset => {
  manager(dataset);
});


function manager(dataset) {
  const { data, numRows, numCols } = prepareData(dataset);

  const labels = dataset.columns.slice(3);
  let label = labels[0];
  
  const [minRain, maxRain] = d3.extent(dataset, d => d['precipitation[mm]']);
  let currentRainExtent = [minRain, maxRain];

  const div = d3.select('#vis');
  const svg = div.append('svg')
      .attr('id', 'container-svg');

  const hist = histogram().x(d3.scaleLinear())
  const scat = scatter()

  let chartType = 'histogram';

  let normalize = false;

  setUpChartSelect();
  setUpLabelSelect();
  setUpFiltering();
  setUpNormalize();
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


  function setUpChartSelect() {
    const precipFiltering = d3.select('#precip-filtering');
    const normalizeSection = d3.select('#normalize');
    const chartSelect = d3.select('#chart-select');

    chartSelect.node().value = chartType;

    chartSelect.on('change', function() {
      chartType = this.value;

      precipFiltering.classed('hide', chartType !== 'scatter');
      normalizeSection.classed('hide', chartType !== 'histogram');

      svg.node().innerHTML = '';
      drawCharts();
    })
  }


  function setUpLabelSelect() {
    const labelSelect = d3.select('#label-select');

    labelSelect.selectAll('option')
      .data(labels)
      .join('option')
        .attr('value', d => d)
        .text(d => d);

    labelSelect.node().value = 'engine';

    labelSelect.on('change', function() {
      label = this.value;
      drawCharts();
    })
  }


  function setUpNormalize() {
    const select = d3.select('#normalize-checkbox');
    select.node().checked = normalize;

    select.on('change', function() {
      normalize = this.checked;
      drawCharts();
    })
  }


  function setUpResize() {
    window.addEventListener('resize', function(e) {
      drawCharts();
    })
  }


  function setUpFiltering() {
    const minInput = d3.select('#min-rain');
    const maxInput = d3.select('#max-rain');
    const filterButton = d3.select('#filter');
    const resetButton = d3.select('#reset');
    
    minInput.node().value = minRain;
    maxInput.node().value = maxRain;

    filterButton.on('click', function() {
      const min = Math.max(minRain, minInput.node().value);
      const max = Math.min(maxRain, maxInput.node().value);

      minInput.node().value = min;
      maxInput.node().value = max;

      currentRainExtent = [min, max];
      drawCharts();
    });
    
    resetButton.on('click', function() {
      minInput.node().value = minRain;
      maxInput.node().value = maxRain;

      currentRainExtent = [minRain, maxRain];
      drawCharts();
    });
  }


  function prepareDataForHistogram() {
    const dataWithBins = data.map(d => {
      const noRain = d.values.filter(d => d['precipitation[mm]'] === 0);
      const rain = d.values.filter(d => d['precipitation[mm]'] > 0);

      const bin = d3.bin()
          .value(v => v[label])
          .domain(hist.x().domain())
          .thresholds(hist.x().ticks(20));

      const noRainBinned = bin(noRain);
      const rainBinned = bin(rain);

      const bins = [
        { type: 'rain', data: rainBinned },
        { type: 'no rain', data: noRainBinned },
      ];

      return {...d, bins};
    });

    const globalYMax = d3.max(dataWithBins,
      d => d3.max(d.bins,
        b => d3.max(b.data, v => v.length)));

    return {dataWithBins, globalYMax};
  }


  function drawCharts() {
    const width = div.node().clientWidth;
    const height = div.node().clientHeight;

    const  margin = {
      top: 20,
      bottom: 20,
      left: 25,
      right: 20
    };
    
    const column = d3.scaleBand()
        .domain(d3.range(numCols))
        .range([margin.left, width - margin.right]);

    const row = d3.scaleBand()
        .domain(d3.range(numRows))
        .range([margin.top, height - margin.bottom]);

    let chart;
    let chartData;

    if (chartType === 'histogram') {
      chart = hist;
      const {dataWithBins, globalYMax} = prepareDataForHistogram();
      chartData = dataWithBins;
      hist.yMax(normalize ? 0 : globalYMax);
    } else {
      chart = scat.label(label)
        .precipitationExtent(currentRainExtent);
      chartData = data;
    }

    chart.width(column.bandwidth())
      .height(row.bandwidth())
    
    const groups = svg.selectAll('.cell')
      .data(chartData)
      .join('g')
        .attr('transform', d => `translate(${column(d.col)}, ${row(d.row)})`)
        .attr('class', 'cell')
      .call(chart);
  }
}
