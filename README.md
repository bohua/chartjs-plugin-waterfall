### Installation
`npm install --save chartjs-plugin-waterfall`

Here's what it looks like:
![WaterFall chart](https://user-images.githubusercontent.com/15030491/32284115-7cb464e6-bf26-11e7-8bcc-67ba8c6fe09d.png)

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
You specify options for this plugin on the `options.plugins.waterFallPlugin` key for example like this:

```js
options: {
  plugins: {
    waterFallPlugin: {
      stepLines: {
        enabled: true,
        startColorStop: 0,
        startColor: `rgba(${0xd2}, ${0x9b}, ${0xaf}, 0.55`, // opaque
        endColorStop: 0.6,
        endColor: `rgba(${0xd2}, ${0x9b}, ${0xaf}, 0`, // transparent
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

### Internals
This plugin uses a `_status` property on the `options.plugins.waterFallPlugin` to track when to draw the stepLines after any animations complete. Don't overwrite this.

### Caveats
- This plugin presumes that each of yours bars in your chart match up either at the top or the bottom of each bar.
If they don't the step lines going from one bar to the next will not be horizontal.

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
