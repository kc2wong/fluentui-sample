import React, { useContext, useEffect } from 'react';
import { PageElementNavigationContext } from '../contexts/Navigation';

const HomePage: React.FC = () => {
  const navigationCtx = useContext(PageElementNavigationContext);

  useEffect(() => {
    // append breadcrumb
    const labelKey = 'system.menu.0';
    if (!navigationCtx.popPageElementNavigationTill(labelKey)) {
      navigationCtx.startPageElementNavigation(labelKey);
    }
  }, [navigationCtx]);
  return <h1>Home Page</h1>;
};

export default HomePage;
