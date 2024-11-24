import {
  Breadcrumb as FluentUiBreadcrumb,
  BreadcrumbItem,
  BreadcrumbDivider,
  BreadcrumbButton,
} from '@fluentui/react-components';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { constructMessage } from '../utils/stringUtil';
import { useLocation } from 'react-router-dom';
import { MenuItem } from '../models/login';
import { isEqual } from '../utils/objectUtil';
import { getMenuItemIdByPath } from '../pages/common';

type PageElement = {
  labelKey: string;
  labelParams?: string[];
  action?: () => void;
};

interface PageElementNavigationContextType {
  pageElementNavigation: PageElement[];
  popPageElementNavigationTill: (
    labelKey: string,
    labelParam?: string[]
  ) => boolean;
  startPageElementNavigation: (labelKey: string, labelParam?: string[]) => void;
  appendPageElementNavigation: (
    labelKey: string,
    labelParam?: string[],
    parentAction?: () => void
  ) => void;
  replaceLastPageElementNavigation: (
    labelKey: string,
    labelParam?: string[]
  ) => void;
}

export const PageElementNavigationContext =
  createContext<PageElementNavigationContextType>({
    pageElementNavigation: [],
    popPageElementNavigationTill: () => false,
    startPageElementNavigation: () => {},
    appendPageElementNavigation: () => {},
    replaceLastPageElementNavigation: () => {},
  });

export const PageElementNavigationProvider: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [pageElementNavigation, setPageElementNavigation] = useState<
    PageElement[]
  >([]);

  const handlePopPageNavigationTill = (
    labelKey: string,
    labelParam?: string[]
  ): boolean => {
    let newPageElement: PageElement[];
    const existingIndex = pageElementNavigation.findIndex(
      (e) => e.labelKey === labelKey
    );
    if (existingIndex < 0) {
      // not found
      return false;
    } else if (existingIndex === pageElementNavigation.length - 1) {
      // already the last one, check if need to replace parameter
      if (
        !isEqual(
          pageElementNavigation[existingIndex].labelParams ?? [],
          labelParam ?? []
        )
      ) {
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

  const handleStartPageNavigation = (
    labelKey: string,
    labelParams?: string[]
  ) => {
    setPageElementNavigation([{ labelKey, labelParams }]);
  };

  const handleAppendPageNavigation = (
    labelKey: string,
    labelParams?: string[],
    parentAction?: () => void
  ) => {
    // check if last element is having same label key or not
    if (
      pageElementNavigation[pageElementNavigation.length - 1]?.labelKey !==
      labelKey
    ) {
      const newPageElement = [...pageElementNavigation];
      if (newPageElement.length > 0) {
        newPageElement[newPageElement.length - 1].action = parentAction;
      }
      newPageElement.push({ labelKey, labelParams });
      setPageElementNavigation(newPageElement);
    }
  };

  const handleReplaceLastPageNavigation = (labelKey: string) => {
    let newPageElement = [...pageElementNavigation];
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

// Recursive function to find the path
const findPath = (
  tree: MenuItem,
  targetId: string,
  path: MenuItem[] = []
): MenuItem[] | undefined => {
  const currentPath = [...path, tree];
  if (tree.id === targetId) {
    return currentPath;
  }
  if (tree.children) {
    for (const child of tree.children) {
      const result = findPath(child, targetId, currentPath);
      if (result) return result;
    }
  }
  return undefined;
};

type BreadcrumbNavigationProps = {
  menuData: MenuItem;
};

export const BreadcrumbNavigation: React.FC<BreadcrumbNavigationProps> = ({
  menuData,
}: BreadcrumbNavigationProps) => {
  const [menuPathIds, setMenuPathIds] = useState<string[]>([]);

  const location = useLocation();
  const { t } = useTranslation();
  const navigation = useContext(PageElementNavigationContext);

  useEffect(() => {
    const menuItemId = getMenuItemIdByPath(location.pathname);
    if (menuItemId) {
      const pathIds = (findPath(menuData, menuItemId) ?? [])
        .map((e) => e.id)
        // remove 'root'
        .slice(1);

      if (!isEqual(menuPathIds, pathIds)) {
        // navigation.reset();
        setMenuPathIds(pathIds);
      }
    }
  }, [location.pathname, menuPathIds, menuData]);

  // const pageNavigation = navigation.getPageElementNavigation();
  const pageNavigation = navigation.pageElementNavigation;

  const lastBreadcrumbItem =
    pageNavigation.length > 0
      ? pageNavigation[pageNavigation.length - 1]
      : menuPathIds[menuPathIds.length - 1];
  return (
    <FluentUiBreadcrumb aria-label="Breadcrumb default example">
      {menuPathIds.map((id) => {
        const label = t(`system.menu.${id}`);
        return (
          <React.Fragment key={id}>
            <BreadcrumbItem>
              {lastBreadcrumbItem === id ? (
                <BreadcrumbButton current>
                  <span>&nbsp;{label}&nbsp;</span>
                </BreadcrumbButton>
              ) : (
                <span>&nbsp;{label}&nbsp;</span>
              )}
            </BreadcrumbItem>
            {lastBreadcrumbItem === id ? <></> : <BreadcrumbDivider />}
          </React.Fragment>
        );
      })}
      {navigation.pageElementNavigation.map((node) => (
        <React.Fragment key={node.labelKey}>
          <BreadcrumbItem>
            <BreadcrumbButton
              current={lastBreadcrumbItem === node}
              onClick={node.action}
            >
              <span>
                &nbsp;{constructMessage(t, node.labelKey, node.labelParams)}
                &nbsp;
              </span>
            </BreadcrumbButton>
          </BreadcrumbItem>
          {lastBreadcrumbItem === node ? <></> : <BreadcrumbDivider />}
        </React.Fragment>
      ))}
    </FluentUiBreadcrumb>
  );
};
