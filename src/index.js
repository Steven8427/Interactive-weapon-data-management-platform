import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import App from './App';
import { I18nProvider, resolveRoute } from './i18n';
import './styles/index.css';

// Language variants live under a URL prefix (/en, /ja, /ko, /zh-tw); route
// the app under that basename so links stay within the current language.
const { basename } = resolveRoute();

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter basename={basename}>
        <I18nProvider>
          <App />
        </I18nProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
