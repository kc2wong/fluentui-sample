import React from 'react';
import { useEffect } from 'react';
import {
  Button,
  Combobox,
  Option,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  Text,
  makeStyles,
  Radio,
  RadioGroup,
  TableSelectionCell,
  tokens,
  Tab,
  TabList,
  createTableColumn,
  TableColumnDefinition,
  useTableFeatures,
} from '@fluentui/react-components';
import { ArrowTurnUpLeftRegular, CheckmarkRegular, DismissRegular } from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { TFunction } from 'i18next';
import { useAtom, useAtomValue } from 'jotai';
import { Control, Controller, useForm, UseFormSetValue } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emptyStringToUndefined } from '../../utils/object-util';
import { constructMessage, formatNumber } from '../../utils/string-util';
import { Field } from '../../components/Field';
import { useAppendBreadcrumb } from '../../contexts/PageElementNavigation';
import { useDialog } from '../../contexts/Dialog';
import { entitledSiteAtom } from '../../states/entitled-site';
import { Form, Root } from '../../components/Container';
import { NumericInput } from '../../components/NumericInput';
import { Currency } from '../../models/currency';
import { PaymentDirection } from '../../models/payment';
import { OperationType, paymentAtom } from '../../states/payment';
import { sharedDataAtom } from '../../states/shared-data';
import { formatDateDDMMYYYY, getCurrentDate, parseDateMMDDYYYY } from '../../utils/date-util';
import { EmptyCell } from '../../components/EmptyCell';
import { Account } from '../../models/account';
import { Input } from '../../components/Input';
import { PaymentStatusBar } from './PaymentStatusComponent';
import { MessageType } from '../../models/system';
import { Memo } from './Memo';
import { useNotification } from '../../states/base-state';
import { useFormDirty } from '../../contexts/FormDirty';
import { useMessage } from '../../contexts/Message';

const useStyles = makeStyles({
  formWrapper: {
    margin: '20px 0 0 20px',
    maxWidth: '500px',
  },
  tab: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  panels: {
    width: '100%',
    '& th': {
      textAlign: 'left',
    },
  },
});

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

const getCcyPrecision = (currencyList: Currency[], ccy?: string) => {
  return currencyList.find((item) => item.code === ccy)?.precision;
};

enum TabPageType {
  Matching,
  Booking,
}

const schema = z
  .object({
    activeTab: z.nativeEnum(TabPageType).default(TabPageType.Matching),
    matchFxRef: z.string().optional(),
    productCode: z.string().optional(),
    valueDate: z.date().optional(),
    newMemo: z.string().optional(),
  })
  .superRefine(({ activeTab, matchFxRef, productCode, valueDate }, ctx) => {
    if (activeTab === TabPageType.Matching) {
      if (matchFxRef === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['matchFxRef'],
          message: 'Required',
        });
      }
    } else if (activeTab === TabPageType.Booking) {
      if (productCode === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['productCode'],
          message: 'Required',
        });
      } else if (valueDate === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['valueDate'],
          message: 'Required',
        });
      }
    }
  });

type FormData = z.infer<typeof schema>;

// function to check if all required fields are entered
const missingRequiredField = (formValues: FormData): boolean => {
  const validationResult = schema.safeParse(emptyStringToUndefined(formValues));
  const missingRequiredFieldIssue = validationResult.error?.issues.find(
    (i) => ['invalid_type', 'custom'].includes(i.code) && i.message === 'Required',
  );
  return missingRequiredFieldIssue !== undefined;
};

type MatchingTabProps = {
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
  site: string;
  ccyList: Currency[];
  t: TFunction;
};
const MatchingTab: React.FC<MatchingTabProps> = ({ control, setValue, site, ccyList, t }) => {
  const [paymentState, paymentAction] = useAtom(paymentAtom);
  useEffect(() => {
    if (!paymentState.potentialMatchDeal) {
      paymentAction({ searchDeal: { entitledSite: [site] } });
    }
  }, [paymentState.potentialMatchDeal, paymentAction, site]);

  type Item = {
    fxRef: string;
    remainingCcy: string;
    remainingAmount: number;
    valueDate: Date;
    dealCcy: string;
    dealAmount: number;
  };

  const columns: TableColumnDefinition<Item>[] = [
    createTableColumn<Item>({
      columnId: 'fxRef',
    }),
    createTableColumn<Item>({
      columnId: 'dealCcy',
    }),
    createTableColumn<Item>({
      columnId: 'dealAmount',
    }),
    createTableColumn<Item>({
      columnId: 'valueDate',
    }),
    createTableColumn<Item>({
      columnId: 'remainingCcy',
    }),
    createTableColumn<Item>({
      columnId: 'remainingAmount',
    }),
  ];

  const items = (paymentState.potentialMatchDeal ?? []).map((d) => ({
    fxRef: d.fxRef,
    dealCcy: d.dealAmount.ccy,
    dealAmount: d.dealAmount.value,
    remainingCcy: d.contraAmount.ccy,
    remainingAmount: d.contraAmount.value,
    valueDate: getCurrentDate(),
  }));

  const { getRows } = useTableFeatures({
    columns,
    items,
  });

  const rows = (matchFxRef?: string) => {
    return getRows((row) => {
      const selected = matchFxRef === row.item.fxRef;
      return {
        ...row,
        selected,
        appearance: selected ? ('brand' as const) : ('none' as const),
      };
    });
  };

  return (
    <Controller
      control={control}
      name="matchFxRef"
      render={({ field }) => {
        return (
          <Table arial-label="Default table" style={{ minWidth: '510px' }}>
            <TableHeader>
              <TableRow style={{ background: tokens.colorNeutralBackground2 }}>
                <TableSelectionCell invisible type="radio" />
                {columns.map((column) => (
                  <TableHeaderCell key={column.columnId}>
                    <TableCellLayout appearance="primary">
                      <span style={{ color: tokens.colorBrandForeground1 }}>
                        {t(`paymentMaintenance.${column.columnId}`)}
                      </span>
                    </TableCellLayout>
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows(field.value).map(({ item, selected, appearance }) => (
                <TableRow
                  key={item.fxRef}
                  appearance={appearance}
                  aria-selected={selected}
                  onClick={() => setValue('matchFxRef', item.fxRef)}
                >
                  <TableSelectionCell checked={selected} type="radio" />
                  <TableCell>{item.fxRef}</TableCell>
                  <TableCell>{item.dealCcy}</TableCell>
                  <TableCell>
                    {formatNumber(item.dealAmount, getCcyPrecision(ccyList, item.dealCcy))}
                  </TableCell>
                  <TableCell>{formatDateDDMMYYYY(item.valueDate)}</TableCell>
                  <TableCell>{item.remainingCcy}</TableCell>
                  <TableCell>
                    {formatNumber(
                      item.remainingAmount,
                      getCcyPrecision(ccyList, item.remainingCcy),
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        );
      }}
    />
  );
};

type BookingTabProps = {
  control: Control<FormData>;
  setValue: UseFormSetValue<FormData>;
  productCode?: string;
  t: TFunction;
};
const BookingTab: React.FC<BookingTabProps> = ({ control, setValue, productCode }) => {
  const getProductValueDate = (productCode?: string): string[] => {
    return paymentState.productValueDate && productCode
      ? paymentState.productValueDate[productCode].map((i) => formatDateDDMMYYYY(i))
      : [];
  };

  const [paymentState, paymentAction] = useAtom(paymentAtom);
  useEffect(() => {
    if (!paymentState.productValueDate) {
      paymentAction({ searchProduct: {} });
    }
  }, [paymentState.productValueDate, paymentAction]);

  const productCodeList = Object.keys(paymentState.productValueDate ?? {});

  return (
    <Form
      numColumn={2}
      styles={{
        margin: tokens.spacingHorizontalL,
        width: '50%',
      }}
    >
      <Controller
        control={control}
        name="productCode"
        render={({ field }) => {
          return (
            <Field label="Produuct">
              <Combobox
                onOptionSelect={(_ev, data) => {
                  if (data.optionValue) {
                    setValue('productCode', data.optionValue);
                  }
                  setValue('valueDate', undefined);
                }}
                selectedOptions={field.value ? [field.value] : []}
                value={field.value ?? ''}
              >
                {productCodeList.map((item) => (
                  <Option key={item}>{item}</Option>
                ))}
              </Combobox>
            </Field>
          );
        }}
      />

      <Controller
        control={control}
        name="valueDate"
        render={({ field }) => {
          return (
            <Field label="Value Date">
              <Combobox
                onOptionSelect={(_ev, data) => {
                  if (data.optionValue) {
                    setValue('valueDate', parseDateMMDDYYYY(data.optionValue));
                  }
                }}
                selectedOptions={field.value ? [formatDateDDMMYYYY(field.value)] : []}
                value={formatDateDDMMYYYY(field.value)}
              >
                {getProductValueDate(productCode).map((item) => (
                  <Option key={item} value={item}>
                    {item}
                  </Option>
                ))}
              </Combobox>
            </Field>
          );
        }}
      />
    </Form>
  );
};

type PaymentDetailPageProps = {
  readOnly: boolean;
  onBackButtonClick: () => void;
  onSubmitButtonClick: () => void;
};

export const PaymentPairingPage: React.FC<PaymentDetailPageProps> = ({
  onBackButtonClick,
  onSubmitButtonClick,
  readOnly,
}: PaymentDetailPageProps) => {
  const styles = useStyles();

  const entitledSiteState = useAtomValue(entitledSiteAtom);
  const [paymentState, paymentAction] = useAtom(paymentAtom);
  // payment should always has a value
  const payment = paymentState.activeRecord;

  const sharedDataState = useAtomValue(sharedDataAtom);
  const ccyList = sharedDataState.resultSet?.currencies ?? [];

  const { t } = useTranslation();
  const { dispatchMessage } = useMessage();
  const { resetDirty } = useFormDirty();
  const { showConfirmationDialog } = useDialog();

  useNotification(paymentState, {
    operationStart: () => {},
    operationComplete: (type, result) => {
      if (type === OperationType.SubmitPayment && result.operationFailureReason?.type !== MessageType.Error) {
        reset();
        resetDirty();
        dispatchMessage({
          type: MessageType.Success,
          text: constructMessage(t, 'paymentMaintenance.message.submitRequestSuccess', [
            formValues.activeTab == TabPageType.Booking
              ? t('paymentMaintenance.pairing.value.booking')
              : t('paymentMaintenance.pairing.value.matching'),
          ]),
        });
        onSubmitButtonClick();
      }
    },
  });

  const {
    control,
    setValue,
    getValues,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      activeTab: TabPageType.Matching,
      newMemo: '',
    },
    resolver: zodResolver(schema),
  });

  const formValues = watch();
  const activeTabValue = formValues.activeTab;

  useEffect(() => {
    // to trigger enable / disable of save button
  }, [formValues]);

  const labelKey = 'paymentMaintenance.pairing.title';
  useAppendBreadcrumb(labelKey, [], onBackButtonClick);

  const getInstructionIdPrefix = (site: string): string | undefined => {
    return entitledSiteState.resultSet?.entitledSite.find((s) => s.site.code === site)?.site
      .instructionIdPrefix;
  };

  const handleAddMemo = (memo: string) => {
    paymentAction({ addMemo: { memo } });
    setValue('newMemo', '');
  };

  const backButton = (
    <Button icon={<ArrowTurnUpLeftRegular />} onClick={onBackButtonClick}>
      {t('system.message.back')}
    </Button>
  );

  const submitButton = (
    <Button
      appearance="primary"
      disabled={missingRequiredField(getValues())}
      icon={<CheckmarkRegular />}
      onClick={handleSubmit(() => {
        if (!readOnly) {
          showConfirmationDialog({
            confirmType: 'submit',
            message: constructMessage(
              t,
              `paymentMaintenance.message.${
                activeTabValue === TabPageType.Matching
                  ? 'doYouWantToSubmitMatchingRequest'
                  : 'doYouWantToSubmitBookingRequest'
              }`,
              activeTabValue === TabPageType.Matching
                ? [formValues.matchFxRef ?? '']
                : [formValues.productCode ?? '', formatDateDDMMYYYY(formValues.valueDate)],
            ),
            primaryButton: {
              label: t('system.message.submit'),
              icon: <CheckmarkRegular />,
              action: () => {
                if (formValues.matchFxRef) {
                  paymentAction({
                    submitPayment: {
                      matchDealPayload: { fxRef: formValues.matchFxRef },
                    },
                  });
                } else if (formValues.productCode && formValues.valueDate) {
                  paymentAction({
                    submitPayment: {
                      bookDealPayload: {
                        product: formValues.productCode,
                        valueDate: formValues.valueDate,
                      },
                    },
                  });
                }
              },
            },
            secondaryButton: {
              label: t('system.message.cancel'),
              icon: <DismissRegular />,
            },
          });
        }
      })}
    >
      {t('system.message.submit')}
    </Button>
  );

  const errorMessageKey =
    activeTabValue === TabPageType.Matching
      ? errors.matchFxRef?.message
      : (errors.productCode?.message ?? errors.valueDate?.message);
  return (
    <Root>
      <Form
        buttons={readOnly ? [backButton] : [backButton, submitButton]}
        numColumn={2}
        styles={{ minWidth: '700px', maxWidth: '50vw' }}
        title={constructMessage(t, 'paymentMaintenance.pairing.title')}
        toolbarSlot={payment ? <PaymentStatusBar payment={payment} /> : <></>}
      >
        <Field
          infoMessage={getAccountName(paymentState.account, payment?.site)}
          label={t('paymentMaintenance.account')}
        >
          <Input readOnly value={payment?.account ?? ''} />
        </Field>
        <EmptyCell />

        <Field label={t('paymentMaintenance.site')}>
          <Input readOnly value={payment?.site ?? ''} />
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
            contentBefore={<Text weight="bold">{payment?.creditAmount.ccy}&nbsp;</Text>}
            decimalPlaces={getCcyPrecision(ccyList, paymentState.activeRecord?.creditAmount.ccy)}
            readOnly
            value={paymentState.activeRecord?.creditAmount.value}
          />
        </Field>

        <Field label={t('paymentMaintenance.bankSell')}>
          <NumericInput
            contentBefore={<Text weight="bold">{payment?.debitAmount.ccy}&nbsp;</Text>}
            decimalPlaces={getCcyPrecision(ccyList, payment?.debitAmount.ccy)}
            readOnly
            value={paymentState.activeRecord?.debitAmount.value}
          />
        </Field>

        <Field label={t('paymentMaintenance.instructionId')}>
          <Input
            contentBefore={
              payment?.site ? (
                <Text weight="bold">{getInstructionIdPrefix(payment?.site)}&nbsp;</Text>
              ) : undefined
            }
            readOnly
            value={payment?.instructionId ?? ''}
          />
        </Field>

        <Field label={t('paymentMaintenance.executeDate')}>
          <Input
            readOnly
            value={payment?.executeDate ? formatDateDDMMYYYY(payment?.executeDate) : ''}
          />
        </Field>

        <Field label={t('paymentMaintenance.fxRef')}>
          <Input readOnly value={payment?.fxRef ?? ''} />
        </Field>
        <EmptyCell />

        <Field
          label={t('paymentMaintenance.action')}
          required
          style={{
            gridColumn: 'span 2',
            marginTop: tokens.spacingVerticalM,
            marginBottom: tokens.spacingVerticalXXXL,
          }}
          validationMessage={errorMessageKey ? t(errorMessageKey) : undefined}
        >
          <div className={styles.tab}>
            <TabList
              appearance="subtle"
              onTabSelect={(_ev, data) => {
                reset({
                  activeTab: data.value as TabPageType,
                  matchFxRef: undefined,
                  productCode: undefined,
                  valueDate: undefined,
                });
              }}
              selectedValue={activeTabValue}
              size="small"
              style={{ width: '100px' }}
            >
              <Tab
                className={activeTabValue === TabPageType.Matching ? 'activeTab' : undefined}
                value={TabPageType.Matching}
              >
                {t('paymentMaintenance.pairing.value.matching')}
              </Tab>
              <Tab
                className={activeTabValue === TabPageType.Booking ? 'activeTab' : undefined}
                value={TabPageType.Booking}
              >
                {t('paymentMaintenance.pairing.value.booking')}
              </Tab>
            </TabList>

            <div className={styles.panels}>
              {activeTabValue === TabPageType.Matching && payment ? (
                <MatchingTab
                  ccyList={ccyList}
                  control={control}
                  setValue={setValue}
                  site={payment.site}
                  t={t}
                ></MatchingTab>
              ) : (
                <BookingTab
                  control={control}
                  productCode={formValues.productCode}
                  setValue={setValue}
                  t={t}
                ></BookingTab>
              )}
            </div>
          </div>
        </Field>
      </Form>
      <div style={{ flex: 1 }}>
        <Memo historyMemo={payment?.memo} onAddMemo={handleAddMemo} readOnly={false} />
      </div>
    </Root>
  );
};
