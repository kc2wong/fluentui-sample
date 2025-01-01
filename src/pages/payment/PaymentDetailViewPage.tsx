import React from 'react';
import { Button, Text, Radio, RadioGroup } from '@fluentui/react-components';
import { ArrowTurnUpLeftRegular, CheckmarkStarburstRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { useAtomValue } from 'jotai';
import { undefinedToEmptyString } from '../../utils/object-util';
import { constructMessage } from '../../utils/string-util';
import { Field } from '../../components/Field';
import { useAppendBreadcrumb } from '../../contexts/PageElementNavigation';
import { entitledSiteAtom } from '../../states/entitled-site';
import { Form, Root } from '../../components/Container';
import { NumericInput } from '../../components/NumericInput';
import { Currency } from '../../models/currency';
import { PaymentDirection, PaymentStatus } from '../../models/payment';
import { paymentAtom } from '../../states/payment';
import { sharedDataAtom } from '../../states/shared-data';
import { formatDateDDMMYYYY } from '../../utils/date-util';
import { EmptyCell } from '../../components/EmptyCell';
import { Account } from '../../models/account';
import { Input } from '../../components/Input';
import { PaymentStatusBar } from './PaymentStatusComponent';
import { Memo } from './Memo';

const getAccountName = (account: Account[], site?: string): string | undefined => {
  switch (account.length) {
    case 0:
      return undefined;
    case 1:
      return account[0].name;
    default:
      return account.find((item) => item.site === site)?.name;
  }
};

const getCcyPrevision = (currencyList: Currency[], ccy?: string) => {
  return currencyList.find((item) => item.code === ccy)?.precision;
};

type PaymentDetailPageProps = {
  onBackButtonPress: () => void;
};

export const PaymentDetailViewPage: React.FC<PaymentDetailPageProps> = ({
  onBackButtonPress,
}: PaymentDetailPageProps) => {
  const { t } = useTranslation();

  const entitledSiteState = useAtomValue(entitledSiteAtom);
  const paymentState = useAtomValue(paymentAtom);

  const payment = paymentState.activeRecord;

  const labelKey = 'paymentMaintenance.titleEdit';
  const mode = 'system.message.view';

  useAppendBreadcrumb(labelKey, mode, onBackButtonPress);

  const getInstructionIdPrefix = (): string | undefined => {
    const siteValue = payment?.site;
    if (siteValue) {
      return entitledSiteState.resultSet?.entitledSite.find((s) => s.site.code === siteValue)?.site
        .instructionIdPrefix;
    } else {
      return undefined;
    }
  };

  const sharedDataState = useAtomValue(sharedDataAtom);
  const ccyList = sharedDataState.resultSet?.currencies ?? [];

  const backButton = (
    <Button icon={<ArrowTurnUpLeftRegular />} onClick={onBackButtonPress}>
      {t('system.message.back')}
    </Button>
  );

  return (
    <Root>
      <Form
        buttons={[backButton]}
        numColumn={2}
        styles={{ minWidth: '700px', maxWidth: '50vw' }}
        title={constructMessage(t, 'paymentMaintenance.titleEdit', [mode])}
        toolbarSlot={payment ? <PaymentStatusBar payment={payment} /> : <></>}
      >
        <Field label={t('paymentMaintenance.site')}>
          <Input readOnly value={undefinedToEmptyString(payment?.site)} />
        </Field>
        <EmptyCell />

        <Field
          infoMessage={getAccountName(paymentState.account, payment?.site)}
          label={t('paymentMaintenance.account')}
        >
          <Input readOnly value={undefinedToEmptyString(payment?.account)} />
        </Field>
        <EmptyCell />

        <Field label={t('paymentMaintenance.direction.label')}>
          <RadioGroup layout="horizontal" value={payment?.direction ?? ''}>
            <Radio
              label={t('paymentMaintenance.direction.value.incoming')}
              value={PaymentDirection.Incoming}
            />
            <Radio
              label={t('paymentMaintenance.direction.value.outgoing')}
              value={PaymentDirection.Outgoing}
            />
          </RadioGroup>
        </Field>
        <EmptyCell />

        <Field label={t('paymentMaintenance.bankBuy')}>
          <NumericInput
            contentAfter={
              payment?.status === PaymentStatus.Paired && !payment?.creditAmount.value ? (
                <CheckmarkStarburstRegular />
              ) : undefined
            }
            contentBefore={<Text weight="bold">{payment?.creditAmount.ccy}&nbsp;</Text>}
            decimalPlaces={getCcyPrevision(ccyList, payment?.creditAmount.ccy)}
            readOnly
            value={payment?.creditAmount.value ?? payment?.pairedAmount}
          />
        </Field>

        <Field label={t('paymentMaintenance.bankSell')}>
          <NumericInput
            contentAfter={
              payment?.status === PaymentStatus.Paired && !payment?.debitAmount.value ? (
                <CheckmarkStarburstRegular />
              ) : undefined
            }
            contentBefore={<Text weight="bold">{payment?.debitAmount?.ccy}&nbsp;</Text>}
            decimalPlaces={getCcyPrevision(ccyList, payment?.debitAmount.ccy)}
            readOnly
            value={payment?.debitAmount.value ?? payment?.pairedAmount}
          />
        </Field>

        <Field label={t('paymentMaintenance.instructionId')}>
          <Input
            contentBefore={<Text weight="bold">{getInstructionIdPrefix()}&nbsp;</Text>}
            readOnly
            value={undefinedToEmptyString(payment?.instructionId)}
          />
        </Field>

        <Field label={t('paymentMaintenance.executeDate')}>
          <Input readOnly value={formatDateDDMMYYYY(payment?.executeDate ?? undefined)} />
        </Field>

        <Field
          label={t(
            `${
              payment?.status === PaymentStatus.Paired
                ? 'paymentMaintenance.pairedFxRef'
                : 'paymentMaintenance.fxRef'
            }`,
          )}
        >
          <Input readOnly value={undefinedToEmptyString(payment?.pairedFxRef ?? payment?.fxRef)} />
        </Field>
        <EmptyCell />

        {payment?.status === PaymentStatus.Paired ? (
          <>
            <Field label={t('paymentMaintenance.product')}>
              <Input readOnly value={undefinedToEmptyString(payment?.product)} />
            </Field>
            <Field label={t('paymentMaintenance.valueDate')}>
              <Input readOnly value={formatDateDDMMYYYY(payment?.valueDate ?? undefined)} />
            </Field>
          </>
        ) : (
          <></>
        )}
      </Form>
      <div style={{ flex: 1 }}>
        <Memo historyMemo={payment?.memo ?? []} readOnly={true} />
      </div>
    </Root>
  );
};
