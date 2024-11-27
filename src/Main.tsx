import React, { useContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HamburgerMenu from './components/HamburgerMenu';
import { OverlayMenu } from './components/OverlayMenu';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import { makeStyles, tokens } from '@fluentui/react-components';
import { SystemToolbar } from './components/SystemToolbar';
import { UserProfile } from './components/UserProfile';

import languageEn from './i18n/en/language.json';
import languageZhHant from './i18n/zhHant/language.json';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { authentication } from './states/authentication';
import { useAtomValue } from 'jotai';
import { ThemedAppContext } from './contexts/Theme';
import { CurrencyMaintenancePage } from './pages/currency/CurrencyMaintenancePage';
import { Language, UiMode } from './models/system';
import { FunctionGroupMaintenancePage } from './pages/functionGroup/FunctionGroupMaintenancePage';
import { Breadcrumb } from './components/Breadcrumb';
import { PageElementNavigationContext } from './contexts/PageElementNavigation';

i18next.use(initReactI18next).init({
  interpolation: { escapeValue: false },
  lng: 'en',
  fallbackLng: 'en',
  resources: {
    en: {
      global: languageEn,
    },
    zhHant: {
      global: languageZhHant,
    },
  },
});

const useStyles = makeStyles({
  app: {
    height: '100vh',
    display: 'flex',
    flexDirection: 'column',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px',
    backgroundColor: tokens.colorNeutralBackground2,
  },
  headerItem: {
    display: 'flex',
    justifyContent: 'flex-start',
    gap: '10px',
  },
  // hamburger icon and breadcrumb
  headerMenu: {
    display: 'flex',
    flexDirection: 'row',
    gap: '20px',
  },
});

export const Main: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const styles = useStyles();
  const { i18n } = useTranslation();
  const { theme, setTheme } = useContext(ThemedAppContext);
  const { pageElementNavigation } = useContext(PageElementNavigationContext);
  const login = useAtomValue(authentication).login;
  const [uiMode, setUiMode] = useState<UiMode>(
    login?.isAdministrator ? 'administrator' : 'operator'
  );

  const isLightTheme = theme === 'light';
  const selectedLanguage =
    i18n.language === 'en' ? Language.English : Language.TraditionalChinese;

  const menuData = uiMode === 'administrator' ? login?.menu[0] : login?.menu[1];
  return (
    <Router>
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.headerMenu}>
            <HamburgerMenu toggleMenu={() => setIsMenuOpen(!isMenuOpen)} />
            {menuData && (
              <Breadcrumb
                menuData={menuData}
                pageElements={pageElementNavigation}
              />
            )}
          </div>
          <div className={styles.headerItem}>
            <SystemToolbar
              mode={uiMode}
              onSetMode={(mode) => {
                if (uiMode !== mode) {
                  setUiMode(mode);
                }
              }}
              language={
                selectedLanguage === Language.English
                  ? Language.English
                  : Language.TraditionalChinese
              }
              onSetLanguage={(value) => {
                i18n.changeLanguage(value === 'zhHant' ? 'zhHant' : 'en');
              }}
              theme={isLightTheme ? 'light' : 'dark'}
              onSetTheme={(theme) => {
                setTheme(theme);
              }}
            />
            {login ? <UserProfile login={login} /> : <></>}
          </div>
        </header>

        {menuData && isMenuOpen && (
          <OverlayMenu
            menuData={menuData}
            closeMenu={() => setIsMenuOpen(false)}
            isOpen={isMenuOpen}
            openMenu={() => setIsMenuOpen(true)}
          />
        )}

        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/currency" element={<CurrencyMaintenancePage />} />
          <Route
            path="/functiongroup"
            element={<FunctionGroupMaintenancePage />}
          />
        </Routes>
      </div>
    </Router>
  );
};
