if (process.env.CONFIG === 'test') {
  module.exports = {
    module: {
      loaders: [
        // add 'use strict' insertion to the blacklist, because it breaks some gl-buffer thing
        { test: /\.js$/, loader: 'babel?blacklist[]=strict' }
      ]
    },
    target: 'web'
  };
} else {
  module.exports = {
    module: {
      loaders: [
        { test: /\.js$/, loader: 'babel' }
      ]
    },
    output: {
      libraryTarget: 'commonjs2'
    },
    externals: [ 'gl-matrix' ],
    target: 'node'
  };
}

