import React, { createContext, useState } from 'react';
import {
  FluentProvider,
  webLightTheme,
  webDarkTheme,
} from '@fluentui/react-components';

export type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const ThemedAppContext = createContext<ThemeContextType>({
  theme: 'light',
  setTheme: () => {},
});

export const ThemedAppProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <ThemedAppContext.Provider value={{ theme, setTheme }}>
      <FluentProvider theme={theme === 'light' ? webLightTheme : webDarkTheme}>
        {children}
      </FluentProvider>
    </ThemedAppContext.Provider>
  );
};
