import { Button } from '@fluentui/react-components';
import { RowTripleFilled } from '@fluentui/react-icons';

import React from 'react';

interface HamburgerMenuProps {
  toggleMenu: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ toggleMenu }) => {
  return (
    <Button
      icon={<RowTripleFilled />}
      aria-label="Menu"
      appearance="subtle"
      onClick={toggleMenu}
    />
  );
};

export default HamburgerMenu;
