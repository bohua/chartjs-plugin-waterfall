import groupBy from 'lodash.groupby';

export default (context, datasets, options) => {
  const stackedDatasets = groupBy(datasets, 'stack');
  const newDatasets = [];
  const getModel = (dataset) => {
    const firstKey = Object.keys(dataset._meta)[0];

    return dataset._meta[firstKey].data[0]._model;
  };

  Object.keys(stackedDatasets).forEach((key) => {
    const currentStackedDataset = stackedDatasets[key];
    const firstRealModel = getModel(currentStackedDataset.find(x => !x.dummyStack));
    const firstModel = getModel(currentStackedDataset[0]);
    const lastModel = getModel(currentStackedDataset[currentStackedDataset.length - 1]);

    newDatasets.push({
      stackRightXPos: firstModel.x + (firstModel.width / 2),
      stackLeftXPos: firstModel.x - (firstModel.width / 2),
      stackRealBottomYPos: firstRealModel.base,
      stackBottomYPos: firstModel.base,
      stackTopYPos: lastModel.y,
    });
  });

  for (let i = 0; i < newDatasets.length; i += 1) {
    const firstDataSet = newDatasets[i];

    if (i !== newDatasets.length - 1) {
      const secondDataSet = newDatasets[i + 1];

      // Needed to convert step lines to look like bars when we have floating stacks
      if (firstDataSet.stackTopYPos === secondDataSet.stackRealBottomYPos) {
        secondDataSet.stackTopYPos = secondDataSet.stackRealBottomYPos;
      } else if (firstDataSet.stackRealBottomYPos === secondDataSet.stackTopYPos) {
        firstDataSet.stackTopYPos = firstDataSet.stackRealBottomYPos;
      }

      // Gradient from top of second box to bottom of both boxes
      const gradient = context.createLinearGradient(
        0,
        secondDataSet.stackTopYPos,
        0,
        secondDataSet.stackBottomYPos,
      );

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
};
