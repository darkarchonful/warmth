// Dynamic config layered on top of app.json.
//
// Google sign-in needs the app to register the *reversed* iOS OAuth client ID
// as a URL scheme, so Google can redirect the completed login back into the
// app. We derive it from EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID at build time rather
// than hardcoding it (the client ID already lives in env / EAS env vars).
module.exports = ({ config }) => {
  const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;

  if (iosClientId) {
    const reversed =
      'com.googleusercontent.apps.' +
      iosClientId.replace(/\.apps\.googleusercontent\.com$/, '');

    config.ios = config.ios || {};
    config.ios.infoPlist = config.ios.infoPlist || {};
    config.ios.infoPlist.CFBundleURLTypes = [
      ...(config.ios.infoPlist.CFBundleURLTypes || []),
      { CFBundleURLSchemes: [reversed] },
    ];
  }

  return config;
};
