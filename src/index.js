import merge from 'lodash.merge';

import drawStepLines from './drawStepLines';

const defaultOptions = {
  waterFallPlugin: {
    stepLines: {
      enabled: true,
      startColorStop: 0,
      endColorStop: 0.6,
      startColor: 'rgba(0, 0, 0, 0.55)', // opaque
      endColor: 'rgba(0, 0, 0, 0)', // transparent
      diagonalStepLines: true,
    },
  },
};

const status = {};

const filterDummyStacks = (legendItem, chartData) => {
  const currentDataset = chartData.datasets[legendItem.datasetIndex];

  return !currentDataset.waterfall.dummyStack;
};

const initializeDatasets = (chart) => {
  chart.data.datasets.forEach((dataset, i) => {
    dataset.waterfall = merge({}, {
      stepLines: {},
    }, dataset.waterfall);

    // Each dataset must have a unique label so we set the dummy stacks to have dummy labels
    if (dataset.waterfall.dummyStack) {
      dataset.label = `dummyStack_${i}`;
      dataset.backgroundColor = 'rgba(0, 0, 0, 0)';
    }
  });
};

const waterFallPlugin = {
  beforeInit: (chart) => {
    status[chart.id] = {
      readyToDrawStepLines: false,
    };
  },
  afterInit: (chart) => {
    initializeDatasets(chart);

    chart.options.plugins = merge({}, defaultOptions, chart.options.plugins);
    chart.options.tooltips.filter = filterDummyStacks;
    chart.options.legend.labels.filter = filterDummyStacks;

    // Can't override onComplete function because it gets overwridden if user using React
    setTimeout(() => {
      status[chart.id].readyToDrawStepLines = true;

      drawStepLines(chart);
    }, chart.options.animation.duration);
  },
  afterDraw: (chart) => {
    const options = chart.options.plugins.waterFallPlugin;

    initializeDatasets(chart);

    if (options.stepLines.enabled &&
        status[chart.id].readyToDrawStepLines) {
      drawStepLines(chart);
    }
  },
};

export default waterFallPlugin;
