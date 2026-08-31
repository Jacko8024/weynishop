import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';
import './lib/i18n.js';
import { useAuth } from './store/auth.js';
import { useCurrency } from './store/currency.js';
import { installDeepLinkHandler } from './lib/deeplink.js';

// Deep-link hook — native only, complete no-op on the website. (Google
// sign-in no longer uses deep links: the native Credential Manager chooser
// returns the ID token directly — see lib/firebase.js.)
installDeepLinkHandler();

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
