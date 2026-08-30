import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';
import './lib/i18n.js';
import { useAuth } from './store/auth.js';
import { useCurrency } from './store/currency.js';
import {
  installDeepLinkHandler,
  setDeepLinkRouter,
  setDeepLinkAuthStore,
  setDeepLinkNotifier,
  finishBootGoogleRedirect,
  deepLinkErrorMessage,
} from './lib/deeplink.js';

// Mobile Google sign-in completion — native only, complete no-op on the
// website. The redirect flow runs inside the WebView (see lib/firebase.js);
// when the app reloads after returning from accounts.google.com this
// resolves the credential and finishes the login. The appUrlOpen listener
// below remains as a deep-link fallback.
installDeepLinkHandler();
setDeepLinkAuthStore(useAuth);
setDeepLinkNotifier((kind, payload) => {
  if (kind === 'error') {
    import('react-hot-toast').then(({ default: toast }) => {
      toast.error(deepLinkErrorMessage(payload?.code));
    });
  }
});
finishBootGoogleRedirect();

// Load the admin-controlled currency rate table once at boot (spec §17).
// Falls back to base ETB silently if the API is unreachable (spec §22).
useCurrency.getState().loadRates();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
      <Toaster position="top-center" />
    </BrowserRouter>
  </React.StrictMode>
);
