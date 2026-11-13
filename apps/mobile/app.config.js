// Lets a dev point the app at a backend on their machine without editing app.json:
//   API_BASE_URL=http://<your-pc-lan-ip>:5000 npx expo start
// Falls back to app.json's extra.apiBaseUrl when the variable isn't set.

// The Google sign-in config plugin has two modes, chosen by whether it receives options.
// With `iosUrlScheme` it takes the non-Firebase path and only writes that URL scheme into
// Info.plist. With no options at all it takes the Firebase path, which requires
// `android.googleServicesFile` and `ios.googleServicesFile` and aborts prebuild when they are
// missing — they are, this project has no Firebase. Android needs no plugin configuration
// (the native module autolinks and `webClientId` is supplied at runtime), so the entry is only
// added once an iOS scheme exists; leaving it out keeps Android prebuild/EAS builds working.
const googleIosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;

module.exports = ({ config }) => ({
  ...config,
  plugins: [
    ...(config.plugins ?? []),
    ...(googleIosUrlScheme
      ? [['@react-native-google-signin/google-signin', { iosUrlScheme: googleIosUrlScheme }]]
      : []),
  ],
  extra: {
    ...config.extra,
    apiBaseUrl: process.env.API_BASE_URL || config.extra?.apiBaseUrl,
    googleWebClientId: process.env.GOOGLE_WEB_CLIENT_ID || config.extra?.googleWebClientId,
  },
});
