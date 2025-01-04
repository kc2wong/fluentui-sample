import React, { useEffect, useRef } from 'react';
import { useAtomValue, useAtom } from 'jotai';
import { paymentAtom } from '../../states/payment';
import { useTranslation } from 'react-i18next';
import { useMessage } from '../../contexts/Message';
import { MessageType } from '../../models/system';
import { useNotification } from '../../states/base-state';
import { sharedDataAtom } from '../../states/shared-data';
import { constructErrorMessage } from '../../utils/string-util';
import { PaymentDetailEditPage } from './PaymentDetailEditPage';
import { PaymentSearchPage } from './PaymentSearchPage';
import { PaymentPairingPage } from './PaymentPairingPage';
import { PaymentStatus } from '../../models/payment';
import { PaymentDetailViewPage } from './PaymentDetailViewPage';
import { usePageElementNavigation } from '../../contexts/PageElementNavigation';
import { usePageTransition } from '../../contexts/PageTransition';

type Mode = 'search' | 'addDetail' | 'editDetail' | 'editPairing' | 'viewDetail' | 'viewPairing';

const PaymentMaintenancePage: React.FC = () => {
  const { showSpinner, stopSpinner, dispatchMessage } = useMessage();
  const { popPageElementNavigationTill, appendPageElementNavigation } = usePageElementNavigation();

  const { t } = useTranslation();

  const [sharedDataState, sharedDataAction] = useAtom(sharedDataAtom);
  const paymentState = useAtomValue(paymentAtom);

  const mode = useRef<Mode>('search');
  const { startTransition } = usePageTransition();

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

  useNotification(paymentState, {
    operationStart: showSpinner,
    operationComplete: (operationType, result) => {
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

  useEffect(() => {
    if (sharedDataState.resultSet?.currencies === undefined) {
      sharedDataAction({ getCurrency: {} });
    }
  }, [sharedDataAction, sharedDataState.resultSet?.currencies]);

  const setMode = (newMode: Mode, actionBeforeTransition?: () => void) => {
    if (mode.current !== newMode) {
      startTransition(() => {
        if (actionBeforeTransition) {
          actionBeforeTransition();
        }
        mode.current = newMode;
      });
    }
  };

  const searchPage = (
    <PaymentSearchPage
      onAddButtonPress={() => {
        setMode('addDetail');
      }}
      onEditButtonPress={(payment) => {
        switch (payment.status) {
          case PaymentStatus.New:
            setMode('editDetail');
            break;
          case PaymentStatus.Started:
            setMode('editPairing', () => {
              const labelKey = 'paymentMaintenance.titleEdit';
              const paramKey = 'system.message.edit';
              if (!popPageElementNavigationTill(labelKey, [paramKey])) {
                appendPageElementNavigation(labelKey, [paramKey], () => {
                  setMode('search');
                });
              }
              setMode('editPairing');
            });
            break;
          default:
            setMode('viewDetail');
            break;
        }
      }}
      onViewButtonPress={(_payment) => {
        setMode('viewDetail');
      }}
    />
  );

  const addDetailPage = (
    <PaymentDetailEditPage
      mode={'add'}
      onBackButtonClick={() => {
        setMode('search');
      }}
      onNextButtonClick={() => {
        setMode('editPairing');
      }}
      onSaveButtonClick={() => {
        setMode('editPairing');
      }}
    />
  );

  const editDetailPage = (
    <PaymentDetailEditPage
      mode={'edit'}
      onBackButtonClick={() => {
        setMode('search');
      }}
      onNextButtonClick={() => {
        setMode('editPairing');
      }}
      onSaveButtonClick={() => {
        setMode('editPairing');
      }}
    />
  );

  const viewDetailPage = (
    <PaymentDetailViewPage
      onBackButtonPress={() => {
        setMode('search');
      }}
    />
  );

  const editPairingPage = (
    <PaymentPairingPage
      onBackButtonClick={() => {
        setMode('editDetail');
      }}
      onSubmitButtonClick={() => {
        setMode('search');
      }}
      readOnly={false}
    />
  );

  const viewPairingPage = (
    <PaymentPairingPage
      onBackButtonClick={() => {
        setMode('viewDetail');
      }}
      onSubmitButtonClick={() => {
        setMode('search');
      }}
      readOnly={true}
    />
  );

  const getPage = () => {
    switch (mode.current) {
      case 'search':
        return searchPage;
      case 'addDetail':
        return addDetailPage;
      case 'editDetail':
        return editDetailPage;
      case 'editPairing':
        return editPairingPage;
      case 'viewDetail':
        return viewDetailPage;
      case 'viewPairing':
        return viewPairingPage;
      default:
        return <></>;
    }
  };

  return getPage();
};

export default PaymentMaintenancePage;
