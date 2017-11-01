import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import uglify from 'rollup-plugin-uglify';
import merge from 'lodash.merge';

const common = {
  input: 'src/index.js',
  name: 'chartjsWPluginWaterfall',
  output: {
    format: 'umd',
  },
  sourcemap: true,
  external: ['lodash.merge', 'lodash.groupby'],
  globals: {
    'lodash.merge': '_.merge',
    'lodash.groupby': '_.groupby',
  },
};

const umdDist = merge({}, common, {
  output: {
    file: 'dist/chartjs-plugin-waterfall.js',
  },
  plugins: [
    eslint(),
    babel({
      exclude: 'node_modules/**',
    }),
  ],
});

const minUmdDist = merge({}, common, {
  output: {
    file: 'dist/chartjs-plugin-waterfall.min.js',
  },
  plugins: [
    eslint(),
    babel({
      exclude: 'node_modules/**',
    }),
    uglify(),
  ],
});

export default [umdDist, minUmdDist];
