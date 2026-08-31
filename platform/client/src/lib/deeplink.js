import { Capacitor } from '@capacitor/core';

// App plugin handle.
//
// The 'App' plugin (appUrlOpen / lifecycle) is provided by the
// @capacitor/app npm package, which brings its own native bridge.
// We resolve it through the plugin registry instead of a static import
// so the web bundle builds even before `npm i @capacitor/app` has been
// run. On web this module's installDeepLinkHandler() never runs, and
// registerPlugin returns an inert proxy either way.
const App = Capacitor.registerPlugin('App', {
    web: () => ({
        addListener: () => Promise.resolve({ remove: async () => { } }),
        removeAllListeners: () => Promise.resolve(),
    }),
});

/**
 * Deep-link entry point (native mobile only).
 *
 * NOTE ON GOOGLE SIGN-IN: since the native Credential Manager flow there is
 * NO redirect round-trip any more — Google's account chooser returns the ID
 * token directly to the app (see lib/firebase.js). The legacy
 * com.weynishop.app://auth/callback deep link and the in-WebView redirect
 * boot-finisher were removed together with that flow. This module now only
 * installs a generic appUrlOpen hook for future deep links (e.g. order
 * links shared from the app), and is intentionally inert on the website.
 */

const AUTH_SCHEME = 'com.weynishop.app';

let installed = false;

export const installDeepLinkHandler = () => {
    if (installed || !Capacitor.isNativePlatform()) return;
    installed = true;

    App.addListener('appUrlOpen', async ({ url }) => {
        // Ignore anything that is not our own scheme for now.
        if (typeof url !== 'string' || !url.startsWith(`${AUTH_SCHEME}://`)) return;
        // Future: route in-app pages from shared links here.
    });
};
