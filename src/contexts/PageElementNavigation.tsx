import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { isEqual } from '../utils/object-util';

export type PageElement = {
  labelKey: string;
  labelParams?: string[];
  action?: () => void;
};

interface PageElementNavigationContextType {
  pageElementNavigation: PageElement[];
  popPageElementNavigationTill: (labelKey: string, labelParam?: string[]) => boolean;
  startPageElementNavigation: (labelKey: string, labelParam?: string[]) => void;
  appendPageElementNavigation: (
    labelKey: string,
    labelParam?: string[],
    parentAction?: () => void,
  ) => void;
  replaceLastPageElementNavigation: (labelKey: string, labelParam?: string[]) => void;
}

const PageElementNavigationContext = createContext<PageElementNavigationContextType>({
  pageElementNavigation: [],
  popPageElementNavigationTill: () => false,
  startPageElementNavigation: () => {},
  appendPageElementNavigation: () => {},
  replaceLastPageElementNavigation: () => {},
});

export const PageElementNavigationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [pageElementNavigation, setPageElementNavigation] = useState<PageElement[]>([]);

  const handlePopPageNavigationTill = (labelKey: string, labelParam?: string[]): boolean => {
    let newPageElement: PageElement[];
    const existingIndex = pageElementNavigation.findIndex((e) => e.labelKey === labelKey);
    if (existingIndex < 0) {
      // not found
      return false;
    } else if (existingIndex === pageElementNavigation.length - 1) {
      // already the last one, check if need to replace parameter
      if (!isEqual(pageElementNavigation[existingIndex].labelParams ?? [], labelParam ?? [])) {
        newPageElement = [...pageElementNavigation];
        newPageElement[existingIndex].labelParams = labelParam;
        setPageElementNavigation(newPageElement);
      }
      return true;
    } else {
      // pop
      if (existingIndex === pageElementNavigation.length - 1) {
        // label of last element is same as labelKey
        newPageElement = [...pageElementNavigation];
        newPageElement[existingIndex].labelParams = labelParam;
      } else {
        newPageElement = pageElementNavigation.slice(0, existingIndex + 1);
        newPageElement[newPageElement.length - 1].action = undefined;
      }
      setPageElementNavigation(newPageElement);
      return true;
    }
  };

  const handleStartPageNavigation = (labelKey: string, labelParams?: string[]) => {
    setPageElementNavigation([{ labelKey, labelParams }]);
  };

  const handleAppendPageNavigation = (
    labelKey: string,
    labelParams?: string[],
    parentAction?: () => void,
  ) => {
    // check if last element is having same label key or not
    if (pageElementNavigation[pageElementNavigation.length - 1]?.labelKey !== labelKey) {
      const newPageElement = [...pageElementNavigation];
      if (newPageElement.length > 0) {
        newPageElement[newPageElement.length - 1].action = parentAction;
      }
      newPageElement.push({ labelKey, labelParams });
      setPageElementNavigation(newPageElement);
    }
  };

  const handleReplaceLastPageNavigation = (labelKey: string) => {
    const newPageElement = [...pageElementNavigation];
    if (newPageElement.length > 1) {
      newPageElement[newPageElement.length - 1].labelKey = labelKey;
    }
    setPageElementNavigation(newPageElement);
  };

  return (
    <PageElementNavigationContext.Provider
      value={{
        pageElementNavigation,
        popPageElementNavigationTill: handlePopPageNavigationTill,
        appendPageElementNavigation: handleAppendPageNavigation,
        replaceLastPageElementNavigation: handleReplaceLastPageNavigation,
        startPageElementNavigation: handleStartPageNavigation,
      }}
    >
      {children}
    </PageElementNavigationContext.Provider>
  );
};

export const usePageElementNavigation = (): PageElementNavigationContextType => {
  const context = useContext(PageElementNavigationContext);
  if (!context) {
    throw new Error('usePageElementNavigation must be used within a PageElementNavigationProvider');
  }
  return context;
};

export const useStartBreadcrumb = (labelKey: string) => {
  const navigationCtx = useContext(PageElementNavigationContext);

  useEffect(() => {
    if (!navigationCtx.popPageElementNavigationTill(labelKey)) {
      navigationCtx.startPageElementNavigation(labelKey);
    }
  }, [navigationCtx, labelKey]);
};

const emptyArray: string[] = [];

export const useAppendBreadcrumb = (
  labelKey: string,
  paramKey?: string | string[],
  action?: () => void,
) => {
  const paramKeyArray = useMemo(() => {
    if (!paramKey) {
      return emptyArray;
    }
    return Array.isArray(paramKey) ? paramKey : [paramKey];
  }, [paramKey]);

  const navigationCtx = useContext(PageElementNavigationContext);
  useEffect(() => {
    if (!navigationCtx.popPageElementNavigationTill(labelKey, paramKeyArray)) {
      navigationCtx.appendPageElementNavigation(labelKey, paramKeyArray, action);
    }
  }, [navigationCtx, labelKey, action, paramKeyArray]);
};
