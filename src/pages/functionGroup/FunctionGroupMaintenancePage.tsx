import { useAtom, useAtomValue } from 'jotai';
import { useEffect, useState } from 'react';
import { useMessage } from '../../contexts/Message';
import { constructErrorMessage } from '../../utils/string-util';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../../states/base-state';
import { MessageType } from '../../models/system';
import { FunctionGroupEditPage } from './FunctionGroupEditPage';
import { sharedDataAtom } from '../../states/shared-data';
import { FunctionGroupSearchPage } from './FunctionGroupSearchPage';
import { functionGroupAtom } from '../../states/function-group';

type Mode = 'search' | 'add' | 'edit' | 'view';

export const FunctionGroupMaintenancePage: React.FC = () => {
  const { showSpinner, stopSpinner, dispatchMessage } = useMessage();
  const { t } = useTranslation();

  const functionGroupState = useAtomValue(functionGroupAtom);
  const [sharedDataState, sharedDataAction] = useAtom(sharedDataAtom);

  useNotification(sharedDataState, {
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

  useNotification(functionGroupState, {
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
    if (sharedDataState.resultSet?.sites === undefined) {
      sharedDataAction({ getSite: {} });
    }
    if (sharedDataState.resultSet?.functionTree === undefined) {
      sharedDataAction({ getFunctionTree: {} });
    }
  }, [sharedDataAction, sharedDataState.resultSet?.sites, sharedDataState.resultSet?.functionTree]);

  const searchPage = (
    <FunctionGroupSearchPage
      onAddButtonPressed={() => setMode('add')}
      onEditButtonPressed={() => setMode('edit')}
      onViewButtonPressed={() => setMode('view')}
    />
  );

  const editPage = (readOnly: boolean) => (
    <FunctionGroupEditPage
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
      if (functionGroupState.activeRecord) {
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
