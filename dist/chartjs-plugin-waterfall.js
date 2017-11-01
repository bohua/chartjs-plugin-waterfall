(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.chartjsWPluginWaterfall = factory());
}(this, (function () { 'use strict';

var drawStepLines = (function (context, datasets, options) {
  var stackedDatasets = _.groupBy(datasets, 'stack');
  var newDatasets = [];
  var getModel = function getModel(dataset) {
    return dataset._meta[0].data[0]._model;
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

var waterFallPlugin = {
  beforeInit: function beforeInit(chart) {
    chart.data.datasets.forEach(function (dataset, i) {
      // Each dataset must have a unique label so we set the dummy stacks to have dummy labels
      dataset.label = !dataset.label ? 'dummyStack_' + i : dataset.label;
      dataset.backgroundColor = dataset.dummyStack ? 'rgba(0, 0, 0, 0)' : dataset.backgroundColor;
    });
  },
  afterDraw: function afterDraw(chart) {
    var options = chart.options.plugins.waterFallPlugin;
    if (options.stepLines.enabled) {
      drawStepLines(chart.ctx, chart.data.datasets, options.stepLines);
    }

    chart.update();
  }
};

return waterFallPlugin;

})));
//# sourceMappingURL=chartjs-plugin-waterfall.js.map
