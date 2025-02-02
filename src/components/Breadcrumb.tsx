import {
  Breadcrumb as FluentUiBreadcrumb,
  BreadcrumbItem,
  BreadcrumbDivider,
  BreadcrumbButton,
} from '@fluentui/react-components';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { constructMessage } from '../utils/string-util';
import { useLocation } from 'react-router-dom';
import { MenuItem } from '../models/login';
import { isEqual } from '../utils/object-util';
import { getMenuItemIdByPath } from '../pages/common';
import { PageElement } from '../contexts/PageElementNavigation';

// Recursive function to find the path
const findPath = (
  tree: MenuItem,
  targetId: string,
  path: MenuItem[] = [],
): MenuItem[] | undefined => {
  const currentPath = [...path, tree];
  if (tree.id === targetId) {
    return currentPath;
  }
  if (tree.children) {
    for (const child of tree.children) {
      const result = findPath(child, targetId, currentPath);
      if (result) {
        return result;
      }
    }
  }
  return undefined;
};

type BreadcrumbNavigationProps = {
  pageElements: PageElement[];
  menuData: MenuItem;
};

export const Breadcrumb: React.FC<BreadcrumbNavigationProps> = ({
  menuData,
  pageElements: pageNavigation,
}: BreadcrumbNavigationProps) => {
  const [menuPathIds, setMenuPathIds] = useState<string[]>([]);

  const location = useLocation();
  const { t } = useTranslation();

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
      {pageNavigation.map((node) => (
        <React.Fragment key={node.labelKey}>
          <BreadcrumbItem>
            <BreadcrumbButton current={lastBreadcrumbItem === node} onClick={node.action}>
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
