import { useAtom, useAtomValue } from 'jotai';
import { useContext, useEffect, useState } from 'react';
import { MessageContext } from '../../contexts/Message';
import {
  constructErrorMessage,
  constructMessage,
} from '../../utils/stringUtil';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../states/baseState';
import { MessageType } from '../../models/system';
import { FunctionGroupEditPage } from './FunctionGroupEditPage';
import { sharedDataAtom } from '../../states/sharedData';
import { FunctionGroupSearchPage } from './FunctionGroupSearchPage';
import { functionGroupAtom } from '../../states/functionGroup';

type Mode = 'search' | 'add' | 'edit' | 'view';

export const FunctionGroupMaintenancePage: React.FC = () => {
  const messageCtx = useContext(MessageContext);
  const { t } = useTranslation();

  const state = useAtomValue(functionGroupAtom);
  const [sharedDataState, sharedDataAction] = useAtom(sharedDataAtom);

  useNotification(sharedDataState, {
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
    if (sharedDataState.resultSet?.sites === undefined) {
      sharedDataAction({ getSite: {} });
    }
    if (sharedDataState.resultSet?.functionTree === undefined) {
      sharedDataAction({ getFunctionTree: {} });
    }
  }, [
    sharedDataAction,
    sharedDataState.resultSet?.sites,
    sharedDataState.resultSet?.functionTree,
  ]);

  const searchPage = (
    <FunctionGroupSearchPage
      onAddButtonPressed={() => setMode('add')}
      onEditButtonPressed={() => setMode('edit')}
      onViewButtonPressed={() => setMode('view')}
    />
  );

  const editPage = (readOnly: boolean) => (
    <FunctionGroupEditPage
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
