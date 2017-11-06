### Installation
`npm install --save chartjs-plugin-waterfall`

Here's what it looks like:
![WaterFall Chart Example](https://user-images.githubusercontent.com/15030491/32444814-28cd3f9c-c304-11e7-9e26-c52e5ec0d25e.png)

### Usage
Just import the plugin and add it to any chart that you want to be a waterfall chart like so:

`import waterFallPlugin from 'chartjs-plugin-waterfall';`

```js
var chart = new Chart(ctx, {
    plugins: [waterFallPlugin]
});
```

See the [plugins](http://www.chartjs.org/docs/latest/developers/plugins.html) documentation for more info.

### How it works
This plugin works by checking if any of your datasets contain a property called `dummyStack` that is set to true.
The `stack` property must be used in conjunction with `dummyStack` for this plugin to work properly.
If `dummyStack` is true then it hides the label, tooltip and sets the color invisible. When you use stacking with this it creates the affect
of a floating bar as shown in the image above that we can use for waterfall charts as chartjs-2 doesn't support waterfall charts
by default.

E.g:

```js
const data = {
  datasets: [
    {
      label: 'Closing Costs',
      data: [50],
      backgroundColor: '#e8cdd7',
      stack: 'stack 1',
    },
    {
      label: 'Purchase Price',
      data: [700],
      backgroundColor: '#d29baf',
      stack: 'stack 1',
    },
    {
      data: [200],
      dummyStack: true,
      stack: 'stack 2',
    },
    {
      label: 'Opening Loan Balance',
      data: [550],
      backgroundColor: '#bb6987',
      stack: 'stack 2',
    },
    {
      label: 'Initial Cash Investment',
      data: [200],
      backgroundColor: '#a53860',
      stack: 'stack 3',
    },
  ],
};
```

This dataset will give us the look in the image above.

### Options
You specify options for this plugin on the `options.plugins.waterFallPlugin`. The default options are:

```js
options: {
  plugins: {
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
  },
  // Your other standard chartjs options here
}
```

`stepLines.enabled`: (boolean) If true then it shows the step-lines going from one bar to another.

`stepLines.startColorStop`: (number) Used as the offset value in the first [`addColorStop`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop) method call.

`stepLines.startColor`: (string) Used as the color value in the first [`addColorStop`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop) method call.

`stepLines.endColorStop`: (number) Used as the offset value in the second [`addColorStop`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop) method call.

`stepLines.endColor`: (string) Used as the color value in the second [`addColorStop`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasGradient/addColorStop) method call.

`stepLines.diagonalStepLines`: (bool | Array[Array[numbers]])) If true then it shows the step-lines going from one bar to another even if the bars don't line up on the y axis.
You can also specify and array of an array of numbers, each inner array represents each bar on your chart and the number represents the stack index to draw the line from and to.
If you specify an index in the inner array that is out of bounds of the stacks index then the step line is not rendered and an error is NOT thrown.

E.g:

```js
diagonalStepLines: [[0, 1], [1, 3]]
```

The above code will draw a step line from the first bar's zero stack to the second bars first stack and another line from the second bars first stack to the
second bars third stack.

### Caveats
- The invisible dummy stacks are removed from the [tooltip](http://www.chartjs.org/docs/latest/configuration/tooltip.html#filter-callback) 
and [legend](http://www.chartjs.org/docs/latest/configuration/legend.html#legend-label-configuration) by default using the `filter` method. 
If you are providing your own filter method, using a custom tooltip or legend of your own then you will have to manually hide them because it will overwrite this plugins.

E.g. This is how this plugin hides them, so you could do it this way:

```js
  filter: function(legendItem, chartData) {
    var currentDataset = chartData.datasets[legendItem.datasetIndex];

    return !currentDataset.dummyStack;
  }
```
