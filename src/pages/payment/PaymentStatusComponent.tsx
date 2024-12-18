import {
  MessageBar,
  MessageBarBody,
  Label,
  tokens,
} from '@fluentui/react-components';
import { t } from 'i18next';
import { Payment, PaymentBase, PaymentStatus } from '../../models/payment';
import { SearchRegular } from '@fluentui/react-icons';

export const PaymentStatusLabel: React.FC<{
  paymentStatus: PaymentStatus;
}> = ({ paymentStatus }) => {
  const statusLabelKey = `paymentMaintenance.status.value.${
    paymentStatus ?? 'new'
  }`;
  const getStatusColor = (status: PaymentStatus): string | undefined => {
    switch (status) {
      case PaymentStatus.New:
      case PaymentStatus.Cancelled:
        return tokens.colorPaletteRoyalBlueForeground2;
      case PaymentStatus.Started:
      case PaymentStatus.Submitted:
        return tokens.colorPaletteDarkOrangeForeground1;
      case PaymentStatus.Paired:
        return tokens.colorPaletteGreenForeground1;
      case PaymentStatus.Rejected:
        return tokens.colorPaletteRedForeground1;
    }
  };

  return paymentStatus ? (
    <Label style={{ color: getStatusColor(paymentStatus) }}>
      {t(statusLabelKey)}
    </Label>
  ) : (
    <></>
  );
};

export const PaymentStatusBar: React.FC<{
  payment?: PaymentBase | Payment;
}> = ({ payment }) => {
  const statusLabelKey = `paymentMaintenance.status.value.${
    payment?.status ?? 'new'
  }`;
  const getStatusColor = (status: PaymentStatus): string | undefined => {
    switch (status) {
      case PaymentStatus.New:
      case PaymentStatus.Cancelled:
        return tokens.colorPaletteRoyalBlueBackground2;
      case PaymentStatus.Started:
      case PaymentStatus.Submitted:
        return tokens.colorPaletteDarkOrangeBackground1;
      case PaymentStatus.Paired:
        return tokens.colorPaletteGreenBackground2;
      case PaymentStatus.Rejected:
        return tokens.colorPaletteRedBackground2;
    }
  };

  return (
    <MessageBar
      style={{
        paddingLeft: tokens.spacingHorizontalXS,
        backgroundColor: getStatusColor(payment?.status ?? PaymentStatus.New),
      }}
      icon={<SearchRegular style={{ display: 'none' }} />}
    >
      <MessageBarBody>{`${t('paymentMaintenance.status.label')}: ${t(
        statusLabelKey
      )}`}</MessageBarBody>
    </MessageBar>
  );
};
