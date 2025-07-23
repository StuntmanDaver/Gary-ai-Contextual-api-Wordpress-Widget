/**
 * Babel Configuration for Gary AI Chat Widget
 * 
 * Transforms ES modules for Jest testing environment.
 * 
 * @package GaryAI
 * @since 1.0.0
 */

module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        targets: {
          node: 'current'
        },
        modules: 'commonjs'
      }
    ]
  ],
  plugins: [
    '@babel/plugin-transform-modules-commonjs'
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              node: 'current'
            },
            modules: 'commonjs'
          }
        ]
      ]
    }
  }
};
