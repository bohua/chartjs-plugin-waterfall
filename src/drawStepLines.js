import groupBy from 'lodash.groupby';

const drawOnCanvas = (context, options, firstDataPoints, secondDataPoints, useFakeBase) => {
  const firstStackBase = useFakeBase ? firstDataPoints.stackFakeBase : firstDataPoints.stackBase;
  const secondStackBase = useFakeBase ? secondDataPoints.stackFakeBase : secondDataPoints.stackBase;

  // Gradient from top of second box to bottom of both boxes
  const gradient = context.createLinearGradient(
    0,
    secondDataPoints.stackTopYPos,
    0,
    secondStackBase,
  );

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

  const getNewDataPoints = (existingDataset) => {
    const newDataPoints = [];
    let stackBase = null;

    existingDataset.forEach((dataset, i) => {
      const model = getModel(dataset);

      if (i === 0) {
        stackBase = model.base;
      }

      newDataPoints.push({
        stackRightXPos: model.x + (model.width / 2),
        stackLeftXPos: model.x - (model.width / 2),
        stackTopYPos: model.y,
        stackBase,
      });
    });

    return newDataPoints;
  };

  Object.keys(stackedDatasets).forEach((key) => {
    const currentStackedDataset = stackedDatasets[key];
    const realStackedDataset = currentStackedDataset.filter(x => !x.dummyStack);

    newDatasets.push({
      allDataPoints: getNewDataPoints(currentStackedDataset),
      allRealDataPoints: getNewDataPoints(realStackedDataset),
    });
  });

  const getFirstDataPointValues = dataset => ({
    stackRightXPos: dataset.allRealDataPoints[0].stackRightXPos,
    stackLeftXPos: dataset.allRealDataPoints[0].stackLeftXPos,
    stackTopYPos: dataset.allRealDataPoints[dataset.allRealDataPoints.length - 1].stackTopYPos,
    stackBase: dataset.allRealDataPoints[0].stackBase,
    stackFakeBase: dataset.allDataPoints[0].stackBase,
  });

  const stacksYPosOrBaseAreEqual = (firstDataPoints, secondDataPoints) =>
    (firstDataPoints.stackTopYPos === secondDataPoints.stackTopYPos &&
    firstDataPoints.stackFakeBase === secondDataPoints.stackFakeBase);

  for (let i = 0; i < newDatasets.length; i += 1) {
    const firstDataSet = newDatasets[i];

    if (i !== newDatasets.length - 1) {
      const secondDataSet = newDatasets[i + 1];
      const firstDataPoints = getFirstDataPointValues(firstDataSet);
      const secondDataPoints = getFirstDataPointValues(secondDataSet);

      // Needed to convert step lines to look like bars when we have floating stacks
      if (firstDataPoints.stackTopYPos === secondDataPoints.stackBase) {
        secondDataPoints.stackTopYPos = secondDataPoints.stackBase;
      } else if (firstDataPoints.stackBase === secondDataPoints.stackTopYPos) {
        firstDataPoints.stackTopYPos = firstDataPoints.stackBase;
      }

      if (options.diagonalStepLines ||
          stacksYPosOrBaseAreEqual(firstDataPoints, secondDataPoints)) {
        drawOnCanvas(context, options, firstDataPoints, secondDataPoints, true);
      }

      if (Array.isArray(options.diagonalStepLines)) {
        options.diagonalStepLines.forEach((dataPointArray) => {
          const firstDataPointIndex = dataPointArray[0];
          const secondDataPointIndex = dataPointArray[1];
          const firstDiagonalDataPoints = firstDataSet.allRealDataPoints[firstDataPointIndex];
          const secondDiagonalDataPoints = secondDataSet.allRealDataPoints[secondDataPointIndex];

          if (firstDiagonalDataPoints && secondDiagonalDataPoints) {
            drawOnCanvas(context, options, firstDiagonalDataPoints, secondDiagonalDataPoints);
          }
        });
      }
    }
  }
};
