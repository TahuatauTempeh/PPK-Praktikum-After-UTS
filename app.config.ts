import type { ConfigContext, ExpoConfig } from 'expo/config';

const MAPS_PLUGIN = 'react-native-maps';

/**
 * Google Maps key hanya dibutuhkan untuk build Android yang memakai peta native.
 * Nilainya dibaca saat config dievaluasi, bukan di-commit ke app.json.
 */
export default ({ config }: ConfigContext): ExpoConfig => {
  const mapsKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
  const plugins = (config.plugins ?? []).filter((plugin) => {
    const name = Array.isArray(plugin) ? plugin[0] : plugin;
    return name !== MAPS_PLUGIN;
  });

  if (mapsKey) {
    plugins.push([MAPS_PLUGIN, { androidGoogleMapsApiKey: mapsKey }]);
  }

  return {
    ...config,
    plugins,
  } as ExpoConfig;
};
