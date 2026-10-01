module.exports = function (api) {
  api.cache(true);
  // React Compiler is enabled by `experiments.reactCompiler` in app.config.js:
  // @expo/cli passes it to babel-preset-expo via the transform caller, and the
  // preset adds babel-plugin-react-compiler itself (with panicThreshold and the
  // opt-out directives configured). Listing the plugin here as well ran the
  // compiler twice over every file.
  const plugins = ['react-native-worklets/plugin'];

  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],

    plugins,
  };
};
