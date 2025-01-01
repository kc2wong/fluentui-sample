import React, { createContext, useContext, useState } from 'react';
import { FluentProvider, webLightTheme, webDarkTheme } from '@fluentui/react-components';

export type Theme = 'light' | 'dark';

interface ThemedAppContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemedAppContext = createContext<ThemedAppContextType>({
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

export const useTheme = (): ThemedAppContextType => {
  const context = useContext(ThemedAppContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemedAppProvider');
  }
  return context;
};
