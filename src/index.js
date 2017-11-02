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
    _status: {
      readyToDrawStepLines: false,
    },
  },
};

const filterDummyStacks = (legendItem, chartData) => {
  const currentDataset = chartData.datasets[legendItem.datasetIndex];

  return !currentDataset.dummyStack;
};

const waterFallPlugin = {
  afterRender: (chart) => {
    const onComplete = chart.options.animation.onComplete;

    chart.options.animation.onComplete = (...args) => {
      chart.options.plugins.waterFallPlugin._status.readyToDrawStepLines = true;

      drawStepLines(chart);
      onComplete(...args);
    };
  },
  afterInit: (chart) => {
    chart.options.plugins = merge({}, defaultOptions, chart.options.plugins);
    chart.options.tooltips.filter = filterDummyStacks;
    chart.options.legend.labels.filter = filterDummyStacks;

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

    if (options.stepLines.enabled &&
        options._status.readyToDrawStepLines) {
      drawStepLines(chart);
    }
  },
};

export default waterFallPlugin;
