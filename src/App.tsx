import React, { useEffect } from 'react';

import languageEn from './i18n/en/language.json';
import languageZhHant from './i18n/zhHant/language.json';
import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import { Main } from './Main';
import { LoginPage } from './pages/LoginPage';
import { useAtomValue } from 'jotai';
import { ThemedAppProvider } from './contexts/Theme';
import { MessageProvider } from './contexts/Message';
import { DialogProvider } from './contexts/Dialog';
import { PageElementNavigationProvider } from './contexts/PageElementNavigation';
import { authentication } from './states/authentication';
import { FormDirtyProvider } from './contexts/FormDirty';
import { traceManager } from './utils/trace-manager';

i18next.use(initReactI18next).init({
  interpolation: { escapeValue: false },
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: { translation: languageEn },
    zhHant: { translation: languageZhHant },
  },
});

const App: React.FC = () => {
  const authenticationState = useAtomValue(authentication);

  useEffect(() => {
    if (authenticationState.login === undefined) {
      traceManager.newTrace();
    }
  }, [authenticationState.login]);

  return (
    <ThemedAppProvider>
      <PageElementNavigationProvider>
        <MessageProvider>
          <DialogProvider>
            {authenticationState.login && authenticationState.acknowledge ? (
              <FormDirtyProvider>
                <Main />
              </FormDirtyProvider>
            ) : (
              <LoginPage />
            )}
          </DialogProvider>
        </MessageProvider>
      </PageElementNavigationProvider>
    </ThemedAppProvider>
  );
};

export default App;
