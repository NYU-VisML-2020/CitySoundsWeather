Promise.all([
  d3.csv('data/predictions-fine-train.csv', d3.autoType),
  d3.csv('data/predictions-coarse-train.csv', d3.autoType),
]).then(datasets => {
  manager(datasets);
});


function manager([fine_dataset, coarse_dataset]) {
  const nodes = new Set(fine_dataset.map(d => d.node));

  const labels = {
    'coarse': coarse_dataset.columns.slice(3),
    'fine': fine_dataset.columns.slice(3),
  }

  const binMap = b => ({x0: b.x0, x1: b.x1, length: b.length});

  let granularity = 'coarse';
  let label = labels[granularity][0];
  let normalize = true;
  let group = 'label';

  const gridSize = {
    'node': {
      'coarse': d3.range(Math.ceil(Math.sqrt(nodes.size))),
      'fine': d3.range(Math.ceil(Math.sqrt(nodes.size))),
    },
    'label': {
      'coarse': d3.range(Math.ceil(Math.sqrt(labels['coarse'].length))),
      'fine': d3.range(Math.ceil(Math.sqrt(labels['fine'].length))),
    },
  };

  const dataByNode = {
    'coarse': prepareDataByNode(coarse_dataset),
    'fine': prepareDataByNode(fine_dataset),
  };

  const dataByLabel = {
    'coarse': prepareDataByLabel(coarse_dataset, 'coarse'),
    'fine': prepareDataByLabel(fine_dataset, 'fine'),
  };

  const div = d3.select('#vis');
  const svg = div.append('svg')
      .attr('id', 'container-svg');

  const color = d3.scaleOrdinal()
    .domain(['rain', 'no rain'])
    .range(d3.schemeCategory10);

  const hist = histogram()
    .x(d3.scaleLinear())
    .color(color);

  setUpGranularitySelect();
  setUpLabelSelect();
  setUpNormalize();
  setUpGroupBySelect();
  setUpResize();

  createLegend(d3.select('#legend'), color);
  drawCharts();


  function prepareDataByNode(dataset) {
    const byNode = Array.from(d3.group(dataset, d => d.node),
                              ([node, values]) => ({node, values}));

    const gridPositions = d3.cross(gridSize['node'][granularity],
                                   gridSize['node'][granularity],
                                   (row, col) => ({row, col}));

    const data = d3.zip(byNode, gridPositions)
        .map(([data, position]) => ({...data, ...position}));

    return data;
  }


  function prepareDataByLabel(dataset, gran) {
    const byLabel = labels[gran].map(l => {
      const bin = d3.bin()
        .value(v => v[l])
        .domain([0, 1])
        .thresholds(d3.scaleLinear().ticks(20))

      const rain = dataset.filter(d => d['precipitation[mm]'] > 0);
      const noRain = dataset.filter(d => d['precipitation[mm]'] === 0);

      return {
        key: l,
        bins: [
          {
            type: 'rain',
            data: bin(rain).map(binMap)
          },
          {
            type: 'no rain',
            data: bin(noRain).map(binMap)
          },
        ]
      };
    });

    const gridPositions = d3.cross(gridSize['label'][gran],
                                   gridSize['label'][gran],
                                   (row, col) => ({row, col}));

    const data = d3.zip(byLabel, gridPositions)
        .map(([data, position]) => ({...data, ...position}));

    const yMax = d3.max(byLabel,
      a => d3.max(a['bins'],
        b => d3.max(b['data'], c => c.length)));

    return {data, yMax};
  }


  function getDataForNodeHistogram() {
    const dataWithBins = dataByNode[granularity].map(d => {
      const noRain = d.values.filter(d => d['precipitation[mm]'] === 0);
      const rain = d.values.filter(d => d['precipitation[mm]'] > 0);

      const bin = d3.bin()
          .value(v => v[label])
          .domain(hist.x().domain())
          .thresholds(hist.x().ticks(20));

      const noRainBinned = bin(noRain).map(binMap);
      const rainBinned = bin(rain).map(binMap);

      const bins = [
        { type: 'rain', data: rainBinned },
        { type: 'no rain', data: noRainBinned },
      ];

      return {
        col: d.col,
        row: d.row,
        key: d.node.slice(10, -6),
        bins
      };
    });

    const globalYMax = d3.max(dataWithBins,
      d => d3.max(d.bins,
        b => d3.max(b.data, v => v.length)));

    return {dataWithBins, globalYMax};
  }


  function setUpGranularitySelect() {
    const granularitySelect = d3.select('#granularity-select');

    granularitySelect.node().value = granularity;

    granularitySelect.on('change', function() {
      granularity = this.value;

      setUpLabelSelect();

      svg.node().innerHTML = '';
      drawCharts();
    })
  }


  function setUpGroupBySelect() {
    const groupBySelect = d3.select('#group-by-select');
    const labelSection = d3.select('#label-section');

    groupBySelect.node().value = group;
    labelSection.classed('hide', group === 'label');

    groupBySelect.on('change', function() {
      group = this.value;
      svg.node().innerHTML = '';
      drawCharts();
      labelSection.classed('hide', group === 'label');
    })
  }


  function setUpLabelSelect() {
    const labelSelect = d3.select('#label-select');

    labelSelect.selectAll('option')
      .data(labels[granularity])
      .join('option')
        .attr('value', d => d)
        .text(d => d);

    label = labels[granularity][0];
    labelSelect.node().value = label;

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


  function drawCharts() {
    const width = div.node().clientWidth;
    const height = div.node().clientHeight;

    const  margin = {
      top: 20,
      bottom: 20,
      left: 25,
      right: 20
    };

    const domain = gridSize[group][granularity];

    const column = d3.scaleBand()
        .domain(domain)
        .range([margin.left, width - margin.right]);

    const row = d3.scaleBand()
        .domain(domain)
        .range([margin.top, height - margin.bottom]);

    hist.width(column.bandwidth())
      .height(row.bandwidth());

    let dataForChart;

    if (group === 'node') {
      const {dataWithBins, globalYMax} = getDataForNodeHistogram();
      hist.yMax(normalize ? 0 : globalYMax);
      dataForChart = dataWithBins;
    } else {
      const {data, yMax} = dataByLabel[granularity];
      hist.yMax(normalize ? 0 : yMax);
      dataForChart = data;
    }

    const groups = svg.selectAll('.cell')
      .data(dataForChart)
      .join('g')
        .attr('transform', d => `translate(${column(d.col)}, ${row(d.row)})`)
        .attr('class', 'cell')
      .call(hist);
  }


  function createLegend(div, color) {
    div.selectAll('svg')
      .data([color.domain()])
      .join('svg')
        .attr('width', 200)
        .attr('height', 35)
      .selectAll('g')
      .data(d => d)
      .join(
        enter => enter.append('g')
            .attr('transform', (d, i) => `translate(0, ${i * 15 + 5})`)
            .call(
              g => g.append('rect')
                  .attr('width', 10)
                  .attr('height', 10)
                  .attr('fill', d => color(d))
            )
            .call(
              g => g.append('text')
                  .attr('x', 15)
                  .attr('y', 10)
                  .attr('fill', 'black')
                  .attr('dominant-baseline', 'center')
                  .attr('font-size', 15)
                  .text(d => d)
            )
      )
  }
}
