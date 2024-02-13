const {
  shareAll,
  withModuleFederationPlugin,
} = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'mfe1',

  exposes: {
    './Module': './src/app/doro/doro.module.ts',
  },

  // shared: share({
  //   "@angular/core": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  //   "@angular/common": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  //   "@angular/common/http": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  //   "@angular/router": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  //   "@angular/forms": { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  //  "@angular/animations" : { singleton: true, strictVersion: true, requiredVersion: 'auto' },
  // })
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
})
