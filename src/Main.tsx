import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HamburgerMenu from './components/HamburgerMenu';
import { OverlayMenu } from './components/OverlayMenu';

import HomePage from './pages/HomePage';
import AboutPage from './pages/AboutPage';
import ServicesPage from './pages/ServicesPage';
import { makeStyles, tokens } from '@fluentui/react-components';
import { SystemToolbar } from './components/SystemToolbar';

import languageEn from './i18n/en/language.json';
import languageZhHant from './i18n/zhHant/language.json';
import i18next from 'i18next';
import { initReactI18next, useTranslation } from 'react-i18next';
import { authentication } from './states/authentication';
import { useAtomValue } from 'jotai';
import { useTheme } from './contexts/Theme';
import { CurrencyMaintenancePage } from './pages/currency/CurrencyMaintenancePage';
import { Language, UiMode } from './models/system';
import { FunctionGroupMaintenancePage } from './pages/functionGroup/FunctionGroupMaintenancePage';
import { Breadcrumb } from './components/Breadcrumb';
import { usePageElementNavigation } from './contexts/PageElementNavigation';
import PaymentMaintenancePage from './pages/payment/PaymentMaintenancePage';
import { getMenuItemIdByPath } from './pages/common';
import { MenuItem } from './models/login';
import { PageTransitionProvider } from './contexts/PageTransition';
import { useFormDirty } from './contexts/FormDirty';
import { useDialog } from './contexts/Dialog';

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
  const { theme, setTheme } = useTheme();
  const { pageElementNavigation } = usePageElementNavigation();
  const { isDirty, resetDirty } = useFormDirty();
  const { showDiscardChangeDialog } = useDialog();
  const login = useAtomValue(authentication).login;

  const findMenuItemById = (menuItem: MenuItem, id: string): MenuItem | undefined => {
    if (menuItem.id === id) {
      return menuItem;
    } else {
      return (menuItem.children ?? []).find((item) => {
        const rtn = findMenuItemById(item, id);
        return rtn ? menuItem : undefined;
      });
    }
  };

  const defaultUiMode = (): UiMode => {
    const pathname = window.location.pathname;
    const id = getMenuItemIdByPath(pathname);
    const menu = id
      ? login?.menu.find((m) => {
          return findMenuItemById(m, id) !== undefined;
        })
      : undefined;
    if (menu) {
      switch (menu.id) {
        case 'administrator':
        case 'operator':
          return menu.id;
        default:
          return login?.isAdministrator ? 'administrator' : 'operator';
      }
    } else {
      return login?.isAdministrator ? 'administrator' : 'operator';
    }
  };
  const [uiMode, setUiMode] = useState<UiMode>(defaultUiMode());

  const isLightTheme = theme === 'light';
  const selectedLanguage = i18n.language === 'en' ? Language.English : Language.TraditionalChinese;

  const menuData = uiMode === 'administrator' ? login?.menu[0] : login?.menu[1];

  const enrichedPageElementNavigation = pageElementNavigation.map((i) => {
    const breadcrumbAction = i.action;
    if (breadcrumbAction) {
      const actionWithConfirmation = () => {
        if (isDirty()) {
          showDiscardChangeDialog({
            action: () => {
              breadcrumbAction();
              resetDirty();
            },
          });
        } else {
          breadcrumbAction();
          resetDirty();
        }
      };
      return {
        action: actionWithConfirmation,
        labelKey: i.labelKey,
        labelParams: i.labelParams,
      };
    } else {
      return { ...i };
    }
  });

  return (
    <Router>
      <div className={styles.app}>
        <header className={styles.header}>
          <div className={styles.headerMenu}>
            <HamburgerMenu toggleMenu={() => setIsMenuOpen(!isMenuOpen)} />
            {menuData && (
              <Breadcrumb menuData={menuData} pageElements={enrichedPageElementNavigation} />
            )}
          </div>
          <div className={styles.headerItem}>
            <SystemToolbar
              language={
                selectedLanguage === Language.English
                  ? Language.English
                  : Language.TraditionalChinese
              }
              mode={uiMode}
              onSetLanguage={(value) => {
                i18n.changeLanguage(value === 'zhHant' ? 'zhHant' : 'en');
              }}
              onSetMode={(mode) => {
                if (uiMode !== mode) {
                  setUiMode(mode);
                }
              }}
              onSetTheme={(theme) => {
                setTheme(theme);
              }}
              theme={isLightTheme ? 'light' : 'dark'}
            />
          </div>
        </header>

        {menuData && isMenuOpen && (
          <OverlayMenu
            closeMenu={() => setIsMenuOpen(false)}
            isOpen={isMenuOpen}
            menuData={menuData}
            openMenu={() => setIsMenuOpen(true)}
          />
        )}

        <PageTransitionProvider>
          <Routes>
            <Route element={<HomePage />} path="/" />
            <Route element={<AboutPage />} path="/about" />
            <Route element={<ServicesPage />} path="/services" />
            <Route element={<CurrencyMaintenancePage />} path="/currency" />
            <Route element={<FunctionGroupMaintenancePage />} path="/functiongroup" />
            <Route element={<PaymentMaintenancePage />} path="/payment" />
          </Routes>
        </PageTransitionProvider>
      </div>
    </Router>
  );
};
