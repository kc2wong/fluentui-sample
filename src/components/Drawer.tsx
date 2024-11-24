import { TFunction } from 'i18next';
import {
  Button,
  DrawerBody,
  DrawerHeader,
  DrawerHeaderTitle,
  InlineDrawer,
  makeStyles,
} from '@fluentui/react-components';
import {
  Dismiss24Regular,
  EraserRegular,
  SearchRegular,
} from '@fluentui/react-icons';
import { ReactElement } from 'react';
import { ButtonPanel } from './ButtonPanel';

const useStylesDrawer = makeStyles({
  drawerSupplementInfo: { maxWidth: '40vw' },
  drawerSsearchCriteria: { minWidth: '400px', maxWidth: '25vw' },
  drawerBodyContent: { display: 'flex', flexDirection: 'column', gap: '20px' },
});

type DrawerComponentProps = {
  children: ReactElement | ReactElement[];
  isOpen: boolean;
  onClose: () => void;
  position: "start" | "end";
  title: string;
  className: string;
  actionButtons?: ReactElement;
};

const DrawerComponent: React.FC<DrawerComponentProps> = ({
  children,
  isOpen,
  onClose,
  position,
  title,
  className,
  actionButtons,
}) => {
  const stylesDrawer = useStylesDrawer();
  return (
    <InlineDrawer className={className} separator open={isOpen} position={position} size="large">
      <DrawerHeader>
        <DrawerHeaderTitle
          action={
            <Button
              appearance="subtle"
              aria-label="Close"
              icon={<Dismiss24Regular />}
              onClick={onClose}
            />
          }
        >
          {title}
        </DrawerHeaderTitle>
      </DrawerHeader>

      <DrawerBody>
        <div className={stylesDrawer.drawerBodyContent}>
          {children}
          {actionButtons && <ButtonPanel>{actionButtons}</ButtonPanel>}
        </div>
      </DrawerBody>
    </InlineDrawer>
  );
};

type SearchCriteriaDrawerProps = {
  children: ReactElement | ReactElement[];
  isOpen: boolean;
  onDrawerClose: () => void;
  onClear: () => void;
  onSearch: () => void;
  title?: string;
  t: TFunction;
};

export const SearchCriteriaDrawer: React.FC<SearchCriteriaDrawerProps> = ({
  children,
  isOpen,
  onDrawerClose,
  onClear,
  onSearch,
  title,
  t,
}) => {
  const stylesDrawer = useStylesDrawer();

  const actionButtons = (
    <>
      <Button icon={<EraserRegular />} onClick={onClear}>
        {t('system.message.clear')}
      </Button>
      <Button appearance="primary" icon={<SearchRegular />} onClick={onSearch}>
        {t('system.message.search')}
      </Button>
    </>
  );

  return (
    <DrawerComponent
      children={children}
      isOpen={isOpen}
      onClose={onDrawerClose}
      position='start'
      title={title ?? t('system.message.searchCriteria')}
      className={stylesDrawer.drawerSsearchCriteria}
      actionButtons={actionButtons}
    />
  );
};

type DetailEditingDrawerProps = {
  children: ReactElement | ReactElement[];
  isOpen: boolean;
  onCloseDrawer: () => void;
  title: string;
  t: TFunction;
};

export const DetailEditingDrawer: React.FC<DetailEditingDrawerProps> = ({
  children,
  isOpen,
  onCloseDrawer,
  title,
}) => {
  const stylesDrawer = useStylesDrawer();

  return (
    <DrawerComponent
      children={children}
      isOpen={isOpen}
      onClose={onCloseDrawer}
      position='end'
      title={title}
      className={stylesDrawer.drawerSupplementInfo}
    />
  );
};
