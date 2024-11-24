import { useAtomValue } from 'jotai';
import { currencyAtom } from '../../states/currency';
import { CurrencySearchPage } from './CurrencySearchPage';
import { CurrencyEditPage } from './CurrencyEditPage';
import { useContext, useEffect, useState } from 'react';
import { MessageContext } from '../../contexts/Message';
import {
  constructErrorMessage,
  constructMessage,
} from '../../utils/stringUtil';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../states/baseState';
import { MessageType } from '../../models/system';

type Mode = 'search' | 'add' | 'edit' | 'view';

export const CurrencyMaintenancePage: React.FC = () => {
  const messageCtx = useContext(MessageContext);
  const { t } = useTranslation();

  const state = useAtomValue(currencyAtom);

  useNotification(state, {
    showSpinner: messageCtx.showSpinner,
    stopSpinner: messageCtx.stopSpinner,
    showOperationResultMessage: (message) => {
      if (message.type === MessageType.Error) {
        messageCtx.dispatchMessage({
          type: message.type,
          text: constructErrorMessage(t, message.key, message.parameters),
        });
      } else {
        messageCtx.dispatchMessage({
          type: message.type,
          text: constructMessage(t, message.key, message.parameters),
        });
      }
    },
  });

  const [mode, setMode] = useState<Mode>('search');
  useEffect(() => {
    // change mode to edit after new record is saved successfully
    if (mode === 'add' && state.activeRecord) {
      setMode('edit');
    }
  }, [mode, state.activeRecord]);

  const searchPage = (
    <CurrencySearchPage
      onAddButtonPressed={() => setMode('add')}
      onEditButtonPressed={() => setMode('edit')}
      onViewButtonPressed={() => setMode('view')}
    />
  );

  const editPage = (readOnly: boolean) => (
    <CurrencyEditPage
      onBackButtonPressed={() => {
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
      if (state.activeRecord) {
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
