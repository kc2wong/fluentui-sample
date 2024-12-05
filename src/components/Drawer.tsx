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
import { Form } from './Container';

const useStylesDrawer = makeStyles({
  drawerSupplementInfo: { maxWidth: '40vw' },
  drawerSsearchCriteria: { minWidth: '400px', maxWidth: '25vw' },
});

type DrawerComponentProps = {
  children: ReactElement | ReactElement[];
  isOpen: boolean;
  onClose: () => void;
  position: 'start' | 'end';
  noPadding: boolean;
  title: string;
  className: string;
};

const DrawerComponent: React.FC<DrawerComponentProps> = ({
  children,
  isOpen,
  onClose,
  position,
  noPadding,
  title,
  className,
  // actionButtons,
}) => {
  const styles = noPadding
    ? { paddingLeft: 'unset', paddingTop: '6px' }
    : { paddingTop: '6px' };
  return (
    <InlineDrawer
      className={className}
      separator
      open={isOpen}
      position={position}
      size="large"
    >
      <DrawerHeader style={styles}>
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

      <DrawerBody style={styles}>{children}</DrawerBody>
    </InlineDrawer>
  );
};

type SearchCriteriaDrawerProps = {
  children: ReactElement[];
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

  const searchForm = (
    <Form
      numColumn={1}
      buttons={[
        <Button icon={<EraserRegular />} onClick={onClear}>
          {t('system.message.reset')}
        </Button>,
        <Button
          appearance="primary"
          icon={<SearchRegular />}
          onClick={onSearch}
        >
          {t('system.message.search')}
        </Button>,
      ]}
    >
      {children}
    </Form>
  );
  return (
    <DrawerComponent
      children={searchForm}
      isOpen={isOpen}
      onClose={onDrawerClose}
      position="start"
      noPadding={true}
      title={title ?? t('system.message.searchCriteria')}
      className={stylesDrawer.drawerSsearchCriteria}
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
      position="end"
      noPadding={false}
      title={title}
      className={stylesDrawer.drawerSupplementInfo}
    />
  );
};
