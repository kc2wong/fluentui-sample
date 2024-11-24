import { Button } from '@fluentui/react-components';
import { RowTripleFilled } from '@fluentui/react-icons';

import React from 'react';

interface HamburgerMenuProps {
  toggleMenu: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ toggleMenu }) => {
  return (
    <Button
      appearance="subtle"
      aria-label="Menu"
      icon={<RowTripleFilled />}
      onClick={toggleMenu}
    />
  );
};

export default HamburgerMenu;
