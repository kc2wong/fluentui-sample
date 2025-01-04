import { useAtomValue } from 'jotai';
import { currencyAtom } from '../../states/currency';
import { CurrencySearchPage } from './CurrencySearchPage';
import { CurrencyEditPage } from './CurrencyEditPage';
import { useEffect, useState } from 'react';
import { useMessage } from '../../contexts/Message';
import { constructErrorMessage } from '../../utils/string-util';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../states/base-state';
import { MessageType } from '../../models/system';

type Mode = 'search' | 'add' | 'edit' | 'view';

export const CurrencyMaintenancePage: React.FC = () => {
  const { showSpinner, stopSpinner, dispatchMessage } = useMessage();
  const { t } = useTranslation();

  const currencyState = useAtomValue(currencyAtom);

  useNotification(currencyState, {
    operationStart: showSpinner,
    operationComplete: (_operationType, result) => {
      stopSpinner();
      const message = result.operationFailureReason;
      if (message?.type === MessageType.Error) {
        dispatchMessage({
          type: message.type,
          text: constructErrorMessage(t, message.key, message.parameters),
        });
      }
    },
  });

  const [mode, setMode] = useState<Mode>('search');
  useEffect(() => {
    // change mode to edit after new record is saved successfully
    if (mode === 'add' && currencyState.activeRecord) {
      setMode('edit');
    }
  }, [mode, currencyState.activeRecord]);

  const searchPage = (
    <CurrencySearchPage
      onAddButtonClick={() => setMode('add')}
      onEditButtonClick={() => setMode('edit')}
      onViewButtonClick={() => setMode('view')}
    />
  );

  const editPage = (readOnly: boolean) => (
    <CurrencyEditPage
      onBackButtonClick={() => {
        setMode('search');
      }}
      readOnly={readOnly}
    />
  );

  switch (mode) {
    case 'search': {
      return searchPage;
    }
    case 'add': {
      return editPage(false);
    }
    case 'view':
    case 'edit': {
      if (currencyState.activeRecord) {
        return editPage(mode === 'view');
      } else {
        // otherwise keep showing the search page
        return searchPage;
      }
    }
    default:
      return <></>;
  }
};
