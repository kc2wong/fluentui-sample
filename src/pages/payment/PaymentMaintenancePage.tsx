import React, { useEffect } from 'react';
import { entitledSiteAtom } from '../../states/entitledSite';
import { useSetAtom, useAtomValue } from 'jotai';
import { paymentAtom } from '../../states/payment';
import { RESET } from 'jotai/utils';

const PaymentMaintenancePage: React.FC = () => {
  const entitledSiteState = useAtomValue(entitledSiteAtom);
  const paymentAction = useSetAtom(paymentAtom);

  useEffect(() => {
    // reset payment when entitled site is changed
    paymentAction(RESET);
  }, [entitledSiteState, paymentAction]);

  return <h1>Home Page</h1>;
};

export default PaymentMaintenancePage;
