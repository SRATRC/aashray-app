const { getSentryExpoConfig } = require('@sentry/react-native/metro');
const { withNativeWind } = require('nativewind/metro');

const config = getSentryExpoConfig(__dirname);

// Defer each module's evaluation to first use instead of running every
// initializer during bundle eval. Wraps rather than replaces the existing
// hook so Expo's experimentalImportSupport is preserved.
const baseGetTransformOptions = config.transformer.getTransformOptions;
config.transformer.getTransformOptions = async (...args) => {
  const base = await baseGetTransformOptions?.(...args);
  return {
    ...base,
    transform: {
      ...base?.transform,
      inlineRequires: true,
    },
  };
};

module.exports = withNativeWind(config, { input: './global.css' });
