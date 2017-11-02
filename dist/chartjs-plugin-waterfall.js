(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash.merge'), require('lodash.groupby')) :
	typeof define === 'function' && define.amd ? define(['lodash.merge', 'lodash.groupby'], factory) :
	(global.chartjsWPluginWaterfall = factory(global._.merge,global._.groupby));
}(this, (function (merge,groupBy) { 'use strict';

merge = merge && merge.hasOwnProperty('default') ? merge['default'] : merge;
groupBy = groupBy && groupBy.hasOwnProperty('default') ? groupBy['default'] : groupBy;

var drawStepLines = (function (context, datasets, options) {
  var stackedDatasets = groupBy(datasets, 'stack');
  var newDatasets = [];
  var getModel = function getModel(dataset) {
    var firstKey = Object.keys(dataset._meta)[0];

    return dataset._meta[firstKey].data[0]._model;
  };

  Object.keys(stackedDatasets).forEach(function (key) {
    var currentStackedDataset = stackedDatasets[key];
    var firstRealModel = getModel(currentStackedDataset.find(function (x) {
      return !x.dummyStack;
    }));
    var firstModel = getModel(currentStackedDataset[0]);
    var lastModel = getModel(currentStackedDataset[currentStackedDataset.length - 1]);

    newDatasets.push({
      stackRightXPos: firstModel.x + firstModel.width / 2,
      stackLeftXPos: firstModel.x - firstModel.width / 2,
      stackRealBottomYPos: firstRealModel.base,
      stackBottomYPos: firstModel.base,
      stackTopYPos: lastModel.y
    });
  });

  for (var i = 0; i < newDatasets.length; i += 1) {
    var firstDataSet = newDatasets[i];

    if (i !== newDatasets.length - 1) {
      var secondDataSet = newDatasets[i + 1];

      // Needed to convert step lines to look like bars when we have floating stacks
      if (firstDataSet.stackTopYPos === secondDataSet.stackRealBottomYPos) {
        secondDataSet.stackTopYPos = secondDataSet.stackRealBottomYPos;
      } else if (firstDataSet.stackRealBottomYPos === secondDataSet.stackTopYPos) {
        firstDataSet.stackTopYPos = firstDataSet.stackRealBottomYPos;
      }

      // Gradient from top of second box to bottom of both boxes
      var gradient = context.createLinearGradient(0, secondDataSet.stackTopYPos, 0, secondDataSet.stackBottomYPos);

      gradient.addColorStop(options.startColorStop, options.startColor);
      gradient.addColorStop(options.endColorStop, options.endColor);

      context.fillStyle = gradient;

      context.beginPath();
      // top right of first box
      context.lineTo(firstDataSet.stackRightXPos, firstDataSet.stackTopYPos);
      // top left of second box
      context.lineTo(secondDataSet.stackLeftXPos, secondDataSet.stackTopYPos);
      // bottom left of second box
      context.lineTo(secondDataSet.stackLeftXPos, secondDataSet.stackBottomYPos);
      // bottom right of first box
      context.lineTo(firstDataSet.stackRightXPos, firstDataSet.stackBottomYPos);
      context.fill();
    }
  }
});

var defaultOptions = {
  waterFallPlugin: {
    stepLines: {
      enabled: true,
      startColorStop: 0,
      endColorStop: 0.6,
      startColor: 'rgba(0, 0, 0, 0.55)', // opaque
      endColor: 'rgba(0, 0, 0, 0)' // transparent
    }
  }
};

var filterDummyStacks = function filterDummyStacks(legendItem, chartData) {
  var currentDataset = chartData.datasets[legendItem.datasetIndex];

  return !currentDataset.dummyStack;
};

var waterFallPlugin = {
  afterInit: function afterInit(chart) {
    chart.options.tooltips.filter = filterDummyStacks;
    chart.options.legend.labels.filter = filterDummyStacks;
    chart.options.plugins = merge({}, defaultOptions, chart.options.plugins);
    chart.data.datasets.forEach(function (dataset, i) {
      // Each dataset must have a unique label so we set the dummy stacks to have dummy labels
      if (dataset.dummyStack) {
        dataset.label = 'dummyStack_' + i;
        dataset.backgroundColor = 'rgba(0, 0, 0, 0)';
      }
    });
  },
  afterDraw: function afterDraw(chart) {
    var options = chart.options.plugins.waterFallPlugin;

    if (options.stepLines.enabled) {
      drawStepLines(chart.ctx, chart.data.datasets, options.stepLines);
    }
  }
};

return waterFallPlugin;

})));
//# sourceMappingURL=chartjs-plugin-waterfall.js.map
