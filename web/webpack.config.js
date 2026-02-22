const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");
const mf = require("@angular-architects/module-federation/webpack");
const path = require("path");
const share = mf.share;
const Dotenv = require('dotenv-webpack');
const sharedMappings = new mf.SharedMappings();
sharedMappings.register(
  path.join(__dirname, 'tsconfig.json'),
  [/* mapped paths to share */]);

module.exports = {
  output: {
    uniqueName: "doro",
    publicPath: "auto",
    scriptType: 'text/javascript'
  },
  optimization: {
    runtimeChunk: false,
    // splitChunks: false  // Add this

  },
  resolve: {
    alias: {
      ...sharedMappings.getAliases(),
      '@assets': path.resolve(__dirname, 'src/assets'),
    },
    // symlinks: true
  },
  
  experiments: {
    outputModule: true
  },
  plugins: [
    new ModuleFederationPlugin({
      name: "doro",
      filename: "remoteEntry3.js",
      exposes: {
        './DoroModule': './src/app/doro/doro.module.ts',
        // './LoadingComponent': './src/app/doro/components/loading/loading.component.ts',
        // './Component': './src/app/doro/doro.component.ts',
      },
      remotes: {
        // "au": "au@https://au2.vercel.app/remoteEntry.js",
        // "au": "au@http://localhost:4204/remoteEntry.js"
      },

      shared: share({
        // "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        // "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        // "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        // "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        // "typlib": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
        // ...sharedMappings.getDescriptors()
        "@angular/core": { singleton: true, strictVersion: true, requiredVersion: '17.0.5', eager: true },
        "@angular/common": { singleton: true, strictVersion: true, requiredVersion: '17.0.5', eager: true },
        // "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: '17.0.5', eager: true },
        "@angular/router": { singleton: true, strictVersion: true, requiredVersion: '17.0.5', eager: true },
        "typlib": { singleton: true, strictVersion: true, requiredVersion: 'auto', eager: true },
        ...sharedMappings.getDescriptors()
      }),

    }),
    sharedMappings.getPlugin(),
    new Dotenv({
      path: './.env', // Path to .env file (this is the default)
    })
  ],
};
