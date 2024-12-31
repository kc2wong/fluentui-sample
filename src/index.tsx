import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import reportWebVitals from './report-web-vitals';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import i18next from 'i18next';

import languageEn from './i18n/en/language.json';
import languageZhHant from './i18n/zhHant/language.json';

const GlobalStyles = () => (
  <style>{`
    body {
      margin: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
        'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
        sans-serif;
      -webkit-font-smoothing: antialiased;
      -moz-osx-font-smoothing: grayscale;
    }
  `}</style>
);

i18next.use(initReactI18next).init({
  interpolation: { escapeValue: false },
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: languageEn },
    zhHant: { translation: languageZhHant },
  },
});

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

root.render(
  <React.StrictMode>
    <>
      <GlobalStyles />
      <I18nextProvider i18n={i18next}>
        <App />
      </I18nextProvider>
    </>
  </React.StrictMode>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
