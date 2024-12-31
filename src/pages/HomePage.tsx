import React from 'react';
import { useStartBreadcrumb } from '../contexts/PageElementNavigation';

const HomePage: React.FC = () => {
  useStartBreadcrumb('system.menu.0');
  return <h1>Home Page</h1>;
};

export default HomePage;
