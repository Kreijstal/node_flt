const path = require('path');

module.exports = {
  entry: './web/main.js',
  output: {
    path: path.resolve(__dirname, 'web'),
    filename: 'main.js',
    publicPath: '/',
  },
  devServer: {
    static: {
      directory: path.join(__dirname, 'web'),
    },
    compress: true,
    port: 9000,
    open: true,
    historyApiFallback: true,
  },
  resolve: {
    fallback: {
      fs: false
    }
  }
};
