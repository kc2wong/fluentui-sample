import {
  Button,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  makeStyles,
  Tree,
  TreeItem,
  TreeItemLayout,
  useRestoreFocusSource,
} from '@fluentui/react-components';
import { Dismiss24Regular } from '@fluentui/react-icons';
import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { MenuItem } from '../models/login';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';
import { getMenuItemPathById } from '../pages/common';
import { MessageContext } from '../contexts/Message';
import { useFormDirty } from '../contexts/FormDirty';
import { useDialog } from '../contexts/Dialog';

const useStyles = makeStyles({
  body: {
    paddingTop: '5px',
  },
});

// Recursive tree renderer with typing for `TreeNode`
const TreeBranch: React.FC<{
  t: TFunction;
  node: MenuItem;
  onLeafClick: (id: string) => void;
}> = ({ t, node, onLeafClick }) => {
  const { isDirty } = useFormDirty();
  const { showDiscardChangeDialog } = useDialog();

  const getLabel = (id: string, defaultLabel: string) => {
    const label = t(id);
    return label === id ? defaultLabel : label;
  };

  const label = getLabel(`system.menu.${node.id}`, node.label);
  const children = node.children;
  return children && children.length > 0 ? (
    <TreeItem itemType="branch">
      <TreeItemLayout>{label}</TreeItemLayout>
      <Tree>
        {children.map((c) => (
          <TreeBranch key={c.id} t={t} node={c} onLeafClick={onLeafClick} />
        ))}
      </Tree>
    </TreeItem>
  ) : (
    <TreeItem key={node.id} itemType="leaf">
      <TreeItemLayout
        onClick={() => {
          if (isDirty()) {
            showDiscardChangeDialog({
              action: () => {
                onLeafClick(node.id);
              },
            });
          } else {
            onLeafClick(node.id);
          }
        }}
      >
        {label}
      </TreeItemLayout>
    </TreeItem>
  );
};

const Menu: React.FC<{
  data: MenuItem;
  onMenuItemClick: (id: string) => void;
}> = ({ data, onMenuItemClick }) => {
  const { t } = useTranslation();

  return (
    <div>
      {/* Tree Component */}
      <Tree aria-label="mainMenu">
        {(data.children ?? []).map((branch) => (
          <TreeBranch
            key={branch.id}
            node={branch}
            t={t}
            onLeafClick={onMenuItemClick}
          />
        ))}
      </Tree>
    </div>
  );
};

interface OverlayMenuProps {
  menuData: MenuItem;
  isOpen: boolean;
  closeMenu: () => void;
  openMenu: () => void;
}

export const OverlayMenu: React.FC<OverlayMenuProps> = ({
  menuData,
  closeMenu,
  openMenu,
  isOpen,
}) => {
  const styles = useStyles();
  const navigate = useNavigate();
  const messageCtx = useContext(MessageContext);

  const handleMenuClick = async (id: string) => {
    const path = getMenuItemPathById(id);
    if (path) {
      messageCtx.showSpinner();
      setTimeout(() => {
        navigate(path);
        closeMenu();
        messageCtx.stopSpinner();
      }, 500);
    }
  };
  const restoreFocusSourceAttributes = useRestoreFocusSource();

  return (
    <Drawer
      {...restoreFocusSourceAttributes}
      type="overlay"
      separator
      open={isOpen}
      onOpenChange={() => (isOpen ? closeMenu() : openMenu())}
    >
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={closeMenu}
            />
          }
        >
          Main Menu
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody className={styles.body}>
        <Menu data={menuData} onMenuItemClick={handleMenuClick} />
      </DrawerBody>
    </Drawer>
  );
};
