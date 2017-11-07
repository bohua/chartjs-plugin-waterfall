import groupBy from 'lodash.groupby';

const DEBUG = false;

const drawOnCanvas = (context, options, firstDatapointValues, secondDatapointValues, useDummyBase) => {
  let firstStackTopYPos = firstDatapointValues.stackTopYPos;
  let secondStackTopYPos = secondDatapointValues.stackTopYPos;

  // If the heights match top to bottom or bottom to top then
  // flip the top coordinates to be at the bottom so that a horizontal step line is drawn
  // as this is what waterfall charts do
  if (firstStackTopYPos === secondDatapointValues.stackBase) {
    secondStackTopYPos = secondDatapointValues.stackBase;
  } else if (firstDatapointValues.stackBase === secondStackTopYPos) {
    firstStackTopYPos = firstDatapointValues.stackBase;
  }

  let firstStackBase = useDummyBase ? firstDatapointValues.stackFakeBase : firstDatapointValues.stackBase;
  let secondStackBase = useDummyBase ? secondDatapointValues.stackFakeBase : secondDatapointValues.stackBase;

  // We need to flip the y co-ords if one of the datasets is negative and the other isn't
  if (!firstDatapointValues.isPositive && secondDatapointValues.isPositive) {
    secondStackTopYPos = secondStackBase;
    secondStackBase = secondDatapointValues.stackTopYPos;
  }

  if (firstDatapointValues.isPositive && !secondDatapointValues.isPositive) {
    firstStackTopYPos = firstStackBase;
    firstStackBase = firstDatapointValues.stackTopYPos;
  }

  // Draws co-ords on the canvas to allow easier debugging
  if (DEBUG) {
    context.font = '9px Arial';
    context.fillStyle = '#000';
    context.fillText(`TR: ${firstDatapointValues.stackRightXPos.toFixed(0)}`, firstDatapointValues.stackRightXPos, firstStackTopYPos);
    context.fillText(`TL: ${secondDatapointValues.stackLeftXPos.toFixed(0)}`, secondDatapointValues.stackLeftXPos, secondStackTopYPos);
    context.fillText(`BL: ${secondStackBase.toFixed(0)}`, secondDatapointValues.stackLeftXPos, secondStackBase);
    context.fillText(`BR: ${firstStackBase.toFixed(0)}`, firstDatapointValues.stackRightXPos, firstStackBase);
  }

  // Makes sure that each step line is consistent
  const yStart = firstStackTopYPos > secondStackTopYPos ? firstStackTopYPos : secondStackTopYPos;
  const yEnd = firstStackBase > secondStackBase ? firstStackBase : secondStackBase;

  // Gradient from top of second box to bottom of both boxes
  const gradient = context.createLinearGradient(0, yStart, 0, yEnd);

  // Dataset options take priority if they are specified
  const startColor = firstDatapointValues.options.startColor || options.startColor;
  const endColor = firstDatapointValues.options.endColor || options.endColor;
  const startColorStop = firstDatapointValues.options.startColorStop || options.startColorStop;
  const endColorStop = firstDatapointValues.options.endColorStop || options.endColorStop;

  gradient.addColorStop(startColorStop, startColor);
  gradient.addColorStop(endColorStop, endColor);

  context.fillStyle = gradient;

  context.beginPath();

  // top right of first box
  context.lineTo(firstDatapointValues.stackRightXPos, firstStackTopYPos);
  // top left of second box
  context.lineTo(secondDatapointValues.stackLeftXPos, secondStackTopYPos);
  // bottom left of second box
  context.lineTo(secondDatapointValues.stackLeftXPos, secondStackBase);
  // bottom right of first box
  context.lineTo(firstDatapointValues.stackRightXPos, firstStackBase);

  context.fill();
};

export default (chart) => {
  const context = chart.ctx;
  const datasets = chart.data.datasets;
  const options = chart.options.plugins.waterFallPlugin.stepLines;
  const stackedDatasets = groupBy(datasets, 'stack');
  const newDatasets = [];

  const getModel = (dataset) => {
    const firstKey = Object.keys(dataset._meta)[0];

    return dataset._meta[firstKey].data[0]._model;
  };

  const getNewDatasets = (existingDataset) => {
    let stackBase = null;

    return existingDataset.map((dataset, i) => {
      const model = getModel(dataset);

      // The first model is always the bottom of the stack
      if (i === 0) {
        stackBase = model.base;
      }

      return {
        stackRightXPos: model.x + (model.width / 2),
        stackLeftXPos: model.x - (model.width / 2),
        stackTopYPos: model.y,
        stackBase,
        isPositive: dataset.data[0] > 0,
        options: dataset.waterfall.stepLines,
      };
    });
  };

  Object.keys(stackedDatasets).forEach((key) => {
    const currentStackedDataset = stackedDatasets[key];
    const realStackedDataset = currentStackedDataset.filter(x => !x.waterfall.dummyStack);

    newDatasets.push({
      // Includes dummy stacks, useful for getting full stack height
      allDataDatapointValues: getNewDatasets(currentStackedDataset),
      // Doesn't include the dummy stacks, useful for getting the visible stack height
      allVisibleDataDatapointValues: getNewDatasets(realStackedDataset),
    });
  });

  const getFirstDatapointValues = dataset => ({
    stackRightXPos: dataset.allVisibleDataDatapointValues[0].stackRightXPos,
    stackLeftXPos: dataset.allVisibleDataDatapointValues[0].stackLeftXPos,
    stackTopYPos: dataset.allVisibleDataDatapointValues[dataset.allVisibleDataDatapointValues.length - 1].stackTopYPos,
    stackBase: dataset.allVisibleDataDatapointValues[0].stackBase,
    isPositive: dataset.allVisibleDataDatapointValues[0].isPositive,
    options: dataset.allVisibleDataDatapointValues[dataset.allVisibleDataDatapointValues.length - 1].options,
    stackFakeBase: dataset.allDataDatapointValues[0].stackBase,
  });

  const stacksYPosAndBaseAreEqual = (firstDatapointValues, secondDatapointValues) =>
    (firstDatapointValues.stackTopYPos === secondDatapointValues.stackTopYPos &&
    firstDatapointValues.stackFakeBase === secondDatapointValues.stackFakeBase);

  for (let i = 0; i < newDatasets.length; i += 1) {
    const firstDataSet = newDatasets[i];

    if (i !== newDatasets.length - 1) {
      const secondDataSet = newDatasets[i + 1];
      const firstDatapointValues = getFirstDatapointValues(firstDataSet);
      const secondDatapointValues = getFirstDatapointValues(secondDataSet);

      if (options.diagonalStepLines ||
          stacksYPosAndBaseAreEqual(firstDatapointValues, secondDatapointValues)) {
        drawOnCanvas(context, options, firstDatapointValues, secondDatapointValues, true);
      }

      if (Array.isArray(options.diagonalStepLines)) {
        options.diagonalStepLines.forEach((stepLinesIndexArray) => {
          const firstCoordinateIndex = stepLinesIndexArray[0];
          const secondCoordinateIndex = stepLinesIndexArray[1];
          const firstDiagonalDatapointValues = firstDataSet.allVisibleDataDatapointValues[firstCoordinateIndex];
          const secondDiagonalDatapointValues = secondDataSet.allVisibleDataDatapointValues[secondCoordinateIndex];

          if (firstDiagonalDatapointValues && secondDiagonalDatapointValues) {
            drawOnCanvas(context, options, firstDiagonalDatapointValues, secondDiagonalDatapointValues);
          }
        });
      }
    }
  }
};
