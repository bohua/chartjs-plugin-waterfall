import babel from 'rollup-plugin-babel';
import eslint from 'rollup-plugin-eslint';
import uglify from 'rollup-plugin-uglify';

const umdDist = {
  entry: 'src/index.js',
  dest: 'dist/chartjs-plugin-waterfall.js',
  name: 'chartjsWPluginWaterfall',
  format: 'umd',
  sourceMap: true,
  plugins: [
    eslint(),
    babel({
      exclude: 'node_modules/**',
    }),
  ],
};

const minUmdDist = {
  entry: 'src/index.js',
  dest: 'dist/chartjs-plugin-waterfall.min.js',
  name: 'chartjsWPluginWaterfall',
  format: 'umd',
  sourceMap: true,
  plugins: [
    eslint(),
    babel({
      exclude: 'node_modules/**',
    }),
    uglify(),
  ],
};

export default [umdDist, minUmdDist];
