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
    },
  },
};

const filterDummyStacks = (legendItem, chartData) => {
  const currentDataset = chartData.datasets[legendItem.datasetIndex];

  return !currentDataset.dummyStack;
};

const waterFallPlugin = {
  afterInit: (chart) => {
    chart.options.tooltips.filter = filterDummyStacks;
    chart.options.legend.labels.filter = filterDummyStacks;
    chart.options.plugins = merge({}, defaultOptions, chart.options.plugins);
    chart.data.datasets.forEach((dataset, i) => {
      // Each dataset must have a unique label so we set the dummy stacks to have dummy labels
      if (dataset.dummyStack) {
        dataset.label = `dummyStack_${i}`;
        dataset.backgroundColor = 'rgba(0, 0, 0, 0)';
      }
    });
  },
  afterDraw: (chart) => {
    const options = chart.options.plugins.waterFallPlugin;

    if (options.stepLines.enabled) {
      drawStepLines(chart.ctx, chart.data.datasets, options.stepLines);
    }
  },
};

export default waterFallPlugin;
