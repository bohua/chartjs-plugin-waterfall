(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory(require('lodash.merge'), require('lodash.groupby')) :
	typeof define === 'function' && define.amd ? define(['lodash.merge', 'lodash.groupby'], factory) :
	(global.chartjsWPluginWaterfall = factory(global._.merge,global._.groupby));
}(this, (function (merge,groupBy) { 'use strict';

merge = merge && merge.hasOwnProperty('default') ? merge['default'] : merge;
groupBy = groupBy && groupBy.hasOwnProperty('default') ? groupBy['default'] : groupBy;

var drawOnCanvas = function drawOnCanvas(context, options, firstDataPoints, secondDataPoints, useFakeBase) {
  var firstStackBase = useFakeBase ? firstDataPoints.stackFakeBase : firstDataPoints.stackBase;
  var secondStackBase = useFakeBase ? secondDataPoints.stackFakeBase : secondDataPoints.stackBase;

  // Gradient from top of second box to bottom of both boxes
  var gradient = context.createLinearGradient(0, secondDataPoints.stackTopYPos, 0, secondStackBase);

  gradient.addColorStop(options.startColorStop, options.startColor);
  gradient.addColorStop(options.endColorStop, options.endColor);

  context.fillStyle = gradient;

  context.beginPath();
  // top right of first box
  context.lineTo(firstDataPoints.stackRightXPos, firstDataPoints.stackTopYPos);
  // top left of second box
  context.lineTo(secondDataPoints.stackLeftXPos, secondDataPoints.stackTopYPos);
  // bottom left of second box
  context.lineTo(secondDataPoints.stackLeftXPos, secondStackBase);
  // bottom right of first box
  context.lineTo(firstDataPoints.stackRightXPos, firstStackBase);
  context.fill();
};

var drawStepLines = (function (chart) {
  var context = chart.ctx;
  var datasets = chart.data.datasets;
  var options = chart.options.plugins.waterFallPlugin.stepLines;
  var stackedDatasets = groupBy(datasets, 'stack');
  var newDatasets = [];
  var getModel = function getModel(dataset) {
    var firstKey = Object.keys(dataset._meta)[0];

    return dataset._meta[firstKey].data[0]._model;
  };

  var getNewDataPoints = function getNewDataPoints(existingDataset) {
    var newDataPoints = [];
    var stackBase = null;

    existingDataset.forEach(function (dataset, i) {
      var model = getModel(dataset);

      if (i === 0) {
        stackBase = model.base;
      }

      newDataPoints.push({
        stackRightXPos: model.x + model.width / 2,
        stackLeftXPos: model.x - model.width / 2,
        stackTopYPos: model.y,
        stackBase: stackBase
      });
    });

    return newDataPoints;
  };

  Object.keys(stackedDatasets).forEach(function (key) {
    var currentStackedDataset = stackedDatasets[key];
    var realStackedDataset = currentStackedDataset.filter(function (x) {
      return !x.dummyStack;
    });

    newDatasets.push({
      allDataPoints: getNewDataPoints(currentStackedDataset),
      allRealDataPoints: getNewDataPoints(realStackedDataset)
    });
  });

  var getFirstDataPointValues = function getFirstDataPointValues(dataset) {
    return {
      stackRightXPos: dataset.allRealDataPoints[0].stackRightXPos,
      stackLeftXPos: dataset.allRealDataPoints[0].stackLeftXPos,
      stackTopYPos: dataset.allRealDataPoints[dataset.allRealDataPoints.length - 1].stackTopYPos,
      stackBase: dataset.allRealDataPoints[0].stackBase,
      stackFakeBase: dataset.allDataPoints[0].stackBase
    };
  };

  var stacksYPosOrBaseAreEqual = function stacksYPosOrBaseAreEqual(firstDataPoints, secondDataPoints) {
    return firstDataPoints.stackTopYPos === secondDataPoints.stackTopYPos && firstDataPoints.stackFakeBase === secondDataPoints.stackFakeBase;
  };

  var _loop = function _loop(i) {
    var firstDataSet = newDatasets[i];

    if (i !== newDatasets.length - 1) {
      var secondDataSet = newDatasets[i + 1];
      var firstDataPoints = getFirstDataPointValues(firstDataSet);
      var secondDataPoints = getFirstDataPointValues(secondDataSet);

      // Needed to convert step lines to look like bars when we have floating stacks
      if (firstDataPoints.stackTopYPos === secondDataPoints.stackBase) {
        secondDataPoints.stackTopYPos = secondDataPoints.stackBase;
      } else if (firstDataPoints.stackBase === secondDataPoints.stackTopYPos) {
        firstDataPoints.stackTopYPos = firstDataPoints.stackBase;
      }

      if (options.diagonalStepLines || stacksYPosOrBaseAreEqual(firstDataPoints, secondDataPoints)) {
        drawOnCanvas(context, options, firstDataPoints, secondDataPoints, true);
      }

      if (Array.isArray(options.diagonalStepLines)) {
        options.diagonalStepLines.forEach(function (dataPointArray) {
          var firstDataPointIndex = dataPointArray[0];
          var secondDataPointIndex = dataPointArray[1];
          var firstDiagonalDataPoints = firstDataSet.allRealDataPoints[firstDataPointIndex];
          var secondDiagonalDataPoints = secondDataSet.allRealDataPoints[secondDataPointIndex];

          if (firstDiagonalDataPoints && secondDiagonalDataPoints) {
            drawOnCanvas(context, options, firstDiagonalDataPoints, secondDiagonalDataPoints);
          }
        });
      }
    }
  };

  for (var i = 0; i < newDatasets.length; i += 1) {
    _loop(i);
  }
});

var defaultOptions = {
  waterFallPlugin: {
    stepLines: {
      enabled: true,
      startColorStop: 0,
      endColorStop: 0.6,
      startColor: 'rgba(0, 0, 0, 0.55)', // opaque
      endColor: 'rgba(0, 0, 0, 0)', // transparent
      diagonalStepLines: true
    }
  }
};

var status = {};

var filterDummyStacks = function filterDummyStacks(legendItem, chartData) {
  var currentDataset = chartData.datasets[legendItem.datasetIndex];

  return !currentDataset.dummyStack;
};

var waterFallPlugin = {
  beforeInit: function beforeInit(chart) {
    status[chart.id] = {
      readyToDrawStepLines: false
    };
  },
  afterInit: function afterInit(chart) {
    chart.options.plugins = merge({}, defaultOptions, chart.options.plugins);
    chart.options.tooltips.filter = filterDummyStacks;
    chart.options.legend.labels.filter = filterDummyStacks;

    // Can't override onComplete function because it gets overwridden if user using React
    setTimeout(function () {
      status[chart.id].readyToDrawStepLines = true;

      drawStepLines(chart);
    }, chart.options.animation.duration);

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

    if (options.stepLines.enabled && status[chart.id].readyToDrawStepLines) {
      drawStepLines(chart);
    }
  }
};

return waterFallPlugin;

})));
//# sourceMappingURL=chartjs-plugin-waterfall.js.map
