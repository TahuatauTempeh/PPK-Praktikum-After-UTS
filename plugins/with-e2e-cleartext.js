const { withAndroidManifest } = require('expo/config-plugins');

module.exports = function withE2ECleartext(config) {
  if (process.env.E2E_ANDROID !== '1') return config;

  return withAndroidManifest(config, (config) => {
    const app = config.modResults.manifest.application?.[0];
    if (app) app.$['android:usesCleartextTraffic'] = 'true';
    return config;
  });
};
