import React, { useRef } from 'react';
import { useContext, useEffect, useState } from 'react';
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
  useId,
  TableCellActions,
  TableSelectionCell,
} from '@fluentui/react-components';
import {
  ArrowCircleLeftRegular,
  ArrowRightRegular,
  ArrowTurnUpLeftRegular,
  CheckmarkRegular,
  DismissRegular,
  DocumentSearchRegular,
  EraserRegular,
  PeopleSearchRegular,
  SearchRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { TFunction } from 'i18next';
import { useAtom, useAtomValue } from 'jotai';
import { Control, Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  emptyStringToUndefined,
  undefinedToEmptyString,
} from '../../utils/objectUtil';
import {
  constructErrorMessage,
  constructMessage,
  stringToEnum,
} from '../../utils/stringUtil';
import { Field } from '../../components/Field';
import { DetailEditingDrawer } from '../../components/Drawer';
import { PageElementNavigationContext } from '../../contexts/PageElementNavigation';
import { DialogContext } from '../../contexts/Dialog';
import { entitledSiteAtom } from '../../states/entitledSite';
import { Form, Root } from '../../components/Container';
import { NumericInput } from '../../components/NumericInput';
import { Row } from '../../components/Row';
import { Currency } from '../../models/currency';
import { Payment, PaymentDirection, PaymentStatus } from '../../models/payment';
import { paymentAtom } from '../../states/payment';
import { sharedDataAtom } from '../../states/sharedData';
import { DatePicker } from '@fluentui/react-datepicker-compat';
import { formatDateDDMMYYYY, parseDateMMDDYYYY } from '../../utils/dateUtil';
import { EmptyCell } from '../../components/EmptyCell';
import { Account } from '../../models/account';
import { MessageContext } from '../../contexts/Message';
import { searchAccount } from '../../services/account';
import { MessageType } from '../../models/system';
import { Input } from '../../components/Input';
import { PaymentStatusBar } from './PaymentStatusComponent';
import { Memo } from './Memo';

const useStyles = makeStyles({
  formWrapper: {
    margin: '20px 0 0 20px',
    maxWidth: '500px',
  },
  bankBuySellCcyCombobox: {
    minWidth: 'unset',
  },
  bankBuySellCcyInput: {
    width: '30px',
  },
  bankBuySellAmount: {
    flex: '1',
  },
});

type BankBuySellProps = {
  control: Control<FormData>;
  creditDebit: 'credit' | 'debit';
  label: string;
  validationMessage?: string;
  ccyList: Currency[];
  precision?: number;
  onCcyChange: (ccy?: string) => void;
  onAmountChange: (amount?: number) => void;
};

const BankBuySell: React.FC<BankBuySellProps> = (props: BankBuySellProps) => {
  const {
    control,
    creditDebit,
    label,
    validationMessage,
    ccyList,
    precision,
    onCcyChange,
    onAmountChange,
  } = props;
  const styles = useStyles();

  const ref = useRef<HTMLInputElement>(null);

  return (
    <Field label={label} required validationMessage={validationMessage}>
      <Row>
        <Controller
          name={`${creditDebit}Ccy`}
          control={control}
          render={({ field }) => (
            <Combobox
              {...field}
              className={styles.bankBuySellCcyCombobox}
              input={{
                className: styles.bankBuySellCcyInput,
              }}
              onOptionSelect={(_e, data) => {
                onCcyChange(data.optionValue);
              }}
            >
              {ccyList
                .sort((e1, e2) => e1.code.localeCompare(e2.code))
                .map((item) => (
                  <Option key={item.code}>{item.code}</Option>
                ))}
            </Combobox>
          )}
        />

        <Controller
          name={`${creditDebit}Amount`}
          control={control}
          render={({ field }) => {
            return (
              <NumericInput
                ref={ref}
                className={styles.bankBuySellAmount}
                value={field.value}
                decimalPlaces={precision}
                onChange={(_ev, data) => {
                  onAmountChange(data.value);
                }}
              />
            );
          }}
        />
      </Row>
    </Field>
  );
};

// form in drawer for editing multi language name or shortname
const accountSearchSchema = z.object({
  site: z.array(z.string()).default([]),
  code: z.string().default(''),
  name: z.string().default(''),
});

type AccountSearchFormData = z.infer<typeof accountSearchSchema>;

type AccountSearchDrawerProps = {
  siteList: string[];
  isOpen: boolean;
  onDrawerClose: () => void;
  onAccountSelect: (account: Account) => void;
  title: string;
  t: TFunction;
};

const AccountSearchDrawer = ({
  isOpen,
  siteList,
  onDrawerClose,
  onAccountSelect,
  title,
  t,
}: AccountSearchDrawerProps) => {
  const { control, getValues, setValue, reset } =
    useForm<AccountSearchFormData>({
      defaultValues: accountSearchSchema.parse({}),
      resolver: zodResolver(accountSearchSchema),
    });
  const [accountSearchResult, setAccountSearchResult] = useState<
    Account[] | undefined
  >(undefined);
  const messageCtx = useContext(MessageContext);
  const columns = [
    { columnKey: 'site', label: t('paymentMaintenance.site') },
    { columnKey: 'code', label: t('paymentMaintenance.code') },
    { columnKey: 'name', label: t('paymentMaintenance.name') },
  ];

  const handleReset = () => {
    reset();
    setAccountSearchResult(undefined);
  };

  const getRowKey = (account: Account) => `${account.site}_${account.code}`;

  return (
    <DetailEditingDrawer
      isOpen={isOpen}
      onCloseDrawer={onDrawerClose}
      title={title}
      t={t}
    >
      <div style={{ maxWidth: '40vw' }}>
        <Form
          numColumn={2}
          buttons={[
            <Button icon={<EraserRegular />} onClick={handleReset}>
              {t('system.message.reset')}
            </Button>,
            <Button
              appearance="primary"
              icon={<SearchRegular />}
              onClick={async () => {
                messageCtx.showSpinner();
                const { site, code, name } = getValues();
                const searchResult = await searchAccount(site, code, name);
                if (Array.isArray(searchResult)) {
                  setAccountSearchResult(searchResult);
                }
                messageCtx.stopSpinner();
              }}
            >
              {t('system.message.search')}
            </Button>,
          ]}
        >
          <Controller
            name="site"
            control={control}
            render={({ field }) => {
              return (
                <Field label={t('paymentMaintenance.site')}>
                  <Combobox
                    {...field}
                    value={field.value.join(',')}
                    multiselect
                    onOptionSelect={(_ev, data) => {
                      setValue(field.name, data.selectedOptions);
                    }}
                  >
                    {siteList.map((item) => (
                      <Option key={item}>{item}</Option>
                    ))}
                  </Combobox>
                </Field>
              );
            }}
          />
          <EmptyCell />

          <Controller
            name="code"
            control={control}
            render={({ field }) => {
              return (
                <Field label={t('paymentMaintenance.code')}>
                  <Input {...field} />
                </Field>
              );
            }}
          />
          <EmptyCell />

          <Controller
            name="name"
            control={control}
            render={({ field }) => {
              return (
                <Field
                  style={{ gridColumn: 'span 2' }}
                  label={t('paymentMaintenance.name')}
                >
                  <Input {...field} />
                </Field>
              );
            }}
          />
        </Form>
      </div>
      {accountSearchResult ? (
        <Table arial-label="Default table">
          <TableHeader>
            <TableRow>
              <TableSelectionCell type="radio" />
              {columns.map((column) => (
                <TableHeaderCell key={column.columnKey}>
                  <Text weight="semibold">{column.label}</Text>
                </TableHeaderCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {accountSearchResult.map((item) => (
              <TableRow key={getRowKey(item)}>
                <TableCell>
                  <TableCellActions>
                    <Button
                      appearance="subtle"
                      icon={<CheckmarkRegular />}
                      onClick={() => onAccountSelect(item)}
                    />
                  </TableCellActions>
                </TableCell>
                <TableCell>
                  <TableCellLayout>{item.site}</TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>{item.code}</TableCellLayout>
                </TableCell>
                <TableCell>
                  <TableCellLayout>{item.name}</TableCellLayout>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <></>
      )}
    </DetailEditingDrawer>
  );
};

const getAccountName = (
  account: Account[],
  site?: string
): string | undefined => {
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

const getErrorMessage = (
  t: TFunction,
  key: (string | undefined)[]
): string | undefined => {
  return key
    .map((item) => {
      if (item) {
        let msg = constructErrorMessage(t, item, []);
        if (!msg.endsWith(`.${item}`)) {
          return msg;
        }
        msg = constructMessage(t, item, []);
        if (msg !== item) {
          return msg;
        }
      }
      return undefined;
    })
    .find((msg) => msg !== undefined);
};

// form for editing payment deetail
const maxAccountLength = 12;
const schema = z
  .object({
    account: z.preprocess(
      (val) => emptyStringToUndefined(val),
      z.string().max(maxAccountLength)
    ),
    site: z.preprocess((val) => emptyStringToUndefined(val), z.string()),
    direction: z.nativeEnum(PaymentDirection),
    creditCcy: z.string(),
    creditAmount: z.number().optional(),
    debitCcy: z.string(),
    debitAmount: z.number().optional(),
    instructionId: z.string().optional(),
    executeDate: z.date().nullable(),
    fxRef: z.string().optional(),
    newMemo: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.creditAmount === undefined && data.debitAmount === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['creditAmount'],
        message: 'Required',
      });
    }
    if (data.creditAmount !== undefined && data.debitAmount !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['creditAmount'],
        message: 'system.error.paymentMaintenance.provideOneAmount',
      });
    }
  });

type FormData = z.infer<typeof schema>;

// function to check if all required fields are entered
const missingRequiredField = (formValues: FormData): boolean => {
  const validationResult = schema.safeParse(emptyStringToUndefined(formValues));
  const missingRequiredFieldIssue = validationResult.error?.issues.find(
    (i) =>
      ['invalid_type', 'custom'].includes(i.code) && i.message === 'Required'
  );
  return missingRequiredFieldIssue !== undefined;
};

type PaymentDetailPageProps = {
  mode: 'add' | 'edit';
  onBack: () => void;
  onNext: () => void;
  onSave: () => void;
};

export const PaymentDetailEditPage: React.FC<PaymentDetailPageProps> = ({
  mode,
  onBack,
  onNext,
  onSave,
}: PaymentDetailPageProps) => {
  const styles = useStyles();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { t } = useTranslation();

  const entitledSiteState = useAtomValue(entitledSiteAtom);
  const [paymentState, paymentAction] = useAtom(paymentAtom);
  const payment = paymentState.activeRecord;
  const isNewPayment = !payment || payment.status === PaymentStatus.New;

  const dialogCtx = useContext(DialogContext);
  const navigationCtx = useContext(PageElementNavigationContext);

  const paymentToFormData = (payment?: Payment) => {
    return {
      // initialize to empty string in order to keep as controlled field
      // account: undefinedToEmptyString(initialData?.account),
      site: undefinedToEmptyString(payment?.site),
      account: undefinedToEmptyString(payment?.account),
      instructionId: undefinedToEmptyString(payment?.instructionId),
      executeDate: payment?.executeDate ?? null,
      direction: payment?.direction,
      creditCcy: undefinedToEmptyString(payment?.creditAmount.ccy),
      creditAmount: payment?.creditAmount.value,
      debitCcy: undefinedToEmptyString(payment?.debitAmount.ccy),
      debitAmount: payment?.debitAmount.value,
      fxRef: undefinedToEmptyString(payment?.fxRef),
      newMemo: '',
    };
  };

  const {
    control,
    setValue,
    getValues,
    handleSubmit,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: paymentToFormData(paymentState.activeRecord),
    resolver: zodResolver(schema),
  });

  const formValues = watch();
  const siteValue = useWatch({
    control,
    name: 'site',
  });
  const creditCcyValue = useWatch({
    control,
    name: 'creditCcy',
  });
  const debitCcyValue = useWatch({
    control,
    name: 'debitCcy',
  });
  const fxRefValue = useWatch({
    control,
    name: 'fxRef',
  });
  const populatedDeal = useRef<string | undefined>(fxRefValue);

  useEffect(() => {
    // to trigger enable / disable of save button
  }, [formValues]);

  useEffect(() => {
    reset(paymentToFormData(paymentState.activeRecord));
  }, [paymentState.activeRecord, reset]);

  useEffect(() => {
    if (paymentState.account.length === 1) {
      setValue('site', paymentState.account[0].site);
    } else {
      setValue('site', '');
    }
  }, [setValue, paymentState.account]);

  useEffect(() => {
    const unPopuldatedDeal = (paymentState.potentialMatchDeal ?? []).find(
      (deal) => deal.fxRef === fxRefValue
    );
    if (unPopuldatedDeal && unPopuldatedDeal.fxRef !== populatedDeal.current) {
      setValue('creditCcy', unPopuldatedDeal.dealAmount.ccy);
      setValue('creditAmount', unPopuldatedDeal.dealAmount.value);
      setValue('debitCcy', unPopuldatedDeal.contraAmount.ccy);
      setValue('debitAmount', unPopuldatedDeal.contraAmount.value);
      populatedDeal.current = unPopuldatedDeal.fxRef;
    }
  }, [setValue, paymentState.potentialMatchDeal, paymentAction, fxRefValue]);

  const title = {
    label: 'paymentMaintenance.titleEdit',
    param: [`system.message.${mode}`],
  };

  useEffect(() => {
    // append breadcrumb
    if (!navigationCtx.popPageElementNavigationTill(title.label, title.param)) {
      navigationCtx.appendPageElementNavigation(
        title.label,
        title.param,
        onBack
      );
    }
  }, [onBack, navigationCtx, title.label, title.param]);

  const handleLookupAccount = (accountCode: string, entitledSite: string[]) => {
    paymentAction({
      searchAccount: {
        code: accountCode,
        entitledSite: entitledSiteCode,
      },
    });
  };

  const handlePopulateDeal = (fxRef: string, entitledSite: string[]) => {
    if (fxRef.length > 0) {
      paymentAction({
        searchDeal: {
          fxRef: fxRef,
          entitledSite: entitledSite,
        },
      });
    }
  };

  const getInstructionIdPrefix = (): string | undefined => {
    if (siteValue.length > 0) {
      return entitledSiteState.resultSet?.entitledSite.find(
        (s) => s.site.code === siteValue
      )?.site.instructionIdPrefix;
    } else {
      return undefined;
    }
  };

  const handleAddMemo = (memo: string) => {
    paymentAction({ addMemo: { memo } });
    setValue('newMemo', '');
  };

  // behaviour of components
  const isAccountDrawerOpen = isDrawerOpen;
  const toggleDrawer = (drawerType: 'account') => {
    if (drawerType === 'account') {
      setIsDrawerOpen(!isAccountDrawerOpen);
    }
  };

  const entitledSiteCode = (entitledSiteState.resultSet?.entitledSite ?? [])
    .filter((item) => item.selected)
    .map((item) => item.site.code)
    .sort((e1, e2) => e1.localeCompare(e2));
  const getSiteOptions = () => {
    const sites =
      paymentState.account.length > 0
        ? paymentState.account.map((item) => item.site)
        : entitledSiteCode;

    return sites
      .filter((item) => entitledSiteCode.includes(item))
      .sort((a, b) => a.localeCompare(b));
  };

  const sharedDataState = useAtomValue(sharedDataAtom);
  const ccyList = sharedDataState.resultSet?.currencies ?? [];

  const accountLookupIconId = useId();

  const backButton = (
    <Button icon={<ArrowTurnUpLeftRegular />} onClick={onBack}>
      {t('system.message.back')}
    </Button>
  );

  const nextButton = (
    <Button icon={<ArrowRightRegular />} onClick={onNext}>
      {t('system.message.next')}
    </Button>
  );

  const saveButton = (
    <Button
      appearance="primary"
      disabled={missingRequiredField(getValues())}
      onClick={handleSubmit(() => {
        dialogCtx.showConfirmationDialog({
          confirmType: 'save',
          message: t(
            'paymentMaintenance.message.doYouWantToInitiatePaymentRequest'
          ),
          primaryButton: {
            label: t('system.message.save'),
            icon: <CheckmarkRegular />,
            action: () => {
              const {
                creditCcy,
                creditAmount,
                debitCcy,
                debitAmount,
                executeDate,
                ...others
              } = getValues();
              paymentAction({
                savePayment: {
                  payment: {
                    ...others,
                    creditAmount: {
                      ccy: creditCcy,
                      value: creditAmount,
                    },
                    debitAmount: {
                      ccy: debitCcy,
                      value: debitAmount,
                    },
                    executeDate: executeDate!,
                    status: PaymentStatus.New,
                  },
                  onSaveSuccess: {
                    message: {
                      key: 'paymentMaintenance.message.initiatePaymentSuccess',
                      type: MessageType.Success,
                      parameters: ['Payment', ''],
                    },
                    callback: (_payment) => {
                      onSave();
                    },
                  },
                },
              });
            },
          },
          secondaryButton: {
            label: t('system.message.cancel'),
            icon: <DismissRegular />,
          },
        });
      })}
      icon={<CheckmarkRegular />}
    >
      {paymentState.activeRecord?.status === PaymentStatus.New
        ? t('system.message.start')
        : t('system.message.save')}
    </Button>
  );

  return (
    <Root>
      <Form
        styles={{ minWidth: '700px', maxWidth: '50vw' }}
        numColumn={2}
        buttons={
          isNewPayment
            ? [backButton, saveButton]
            : [backButton, nextButton, saveButton]
        }
        title={constructMessage(t, title.label, title.param)}
        toolbarSlot={<PaymentStatusBar payment={paymentState.activeRecord} />}
      >
        <Controller
          name="account"
          control={control}
          render={({ field }) => {
            return (
              <Field
                label={t('paymentMaintenance.account')}
                required
                validationMessage={errors?.account?.message}
                infoMessage={getAccountName(paymentState.account, siteValue)}
              >
                {isNewPayment ? (
                  <Input
                    {...field}
                    disabled={isAccountDrawerOpen}
                    onBlur={(ev) => {
                      if (ev.relatedTarget?.id !== accountLookupIconId) {
                        handleLookupAccount(field.value, entitledSiteCode);
                      }
                    }}
                    contentAfter={
                      <Button
                        id={accountLookupIconId}
                        appearance="transparent"
                        size="small"
                        icon={
                          isAccountDrawerOpen ? (
                            <ArrowCircleLeftRegular />
                          ) : (
                            <PeopleSearchRegular />
                          )
                        }
                        tabIndex={-1}
                        onClick={() => toggleDrawer('account')}
                      ></Button>
                    }
                  />
                ) : (
                  <Input disabled value={field.value}></Input>
                )}
              </Field>
            );
          }}
        />
        <EmptyCell />

        <Controller
          name="site"
          control={control}
          render={({ field }) => {
            return (
              <Field
                label={t('paymentMaintenance.site')}
                required
                validationMessage={errors?.site?.message}
              >
                {isNewPayment ? (
                  <Combobox
                    {...field}
                    className={styles.bankBuySellCcyCombobox}
                    input={{
                      className: styles.bankBuySellCcyInput,
                    }}
                    onOptionSelect={(_ev, data) => {
                      if (data.optionValue) {
                        setValue('site', data.optionValue);
                      }
                    }}
                    value={field.value}
                    selectedOptions={[field.value]}
                  >
                    {getSiteOptions().map((item) => (
                      <Option key={item}>{item}</Option>
                    ))}
                  </Combobox>
                ) : (
                  <Input disabled value={field.value}></Input>
                )}
              </Field>
            );
          }}
        />
        <EmptyCell />

        <Controller
          name="direction"
          control={control}
          render={({ field }) => (
            <Field
              label={t('paymentMaintenance.direction.label')}
              required
              validationMessage={errors?.direction?.message}
            >
              <RadioGroup
                layout="horizontal"
                onChange={(_e, data) => {
                  const newValue = stringToEnum(PaymentDirection, data.value);
                  if (newValue) {
                    setValue('direction', newValue);
                  }
                }}
                value={field.value ?? ''}
              >
                <Radio
                  value={PaymentDirection.Incoming}
                  label={t('paymentMaintenance.direction.value.incoming')}
                />
                <Radio
                  value={PaymentDirection.Outgoing}
                  label={t('paymentMaintenance.direction.value.outgoing')}
                />
              </RadioGroup>
            </Field>
          )}
        />
        <EmptyCell />

        <BankBuySell
          control={control}
          creditDebit="credit"
          validationMessage={getErrorMessage(t, [
            errors?.creditCcy?.message,
            errors?.creditAmount?.message,
          ])}
          label={t('paymentMaintenance.bankBuy')}
          ccyList={ccyList}
          precision={getCcyPrevision(ccyList, creditCcyValue)}
          onCcyChange={(value) => {
            if (value) {
              setValue('creditCcy', value);
              if (getValues().debitCcy === value) {
                setValue('debitCcy', '');
              }
            }
          }}
          onAmountChange={(value) => {
            setValue('creditAmount', value);
          }}
        />

        <BankBuySell
          control={control}
          creditDebit="debit"
          validationMessage={
            errors?.debitCcy?.message ?? errors?.debitCcy?.message
          }
          label={t('paymentMaintenance.bankSell')}
          ccyList={ccyList}
          precision={getCcyPrevision(ccyList, debitCcyValue)}
          onCcyChange={(value) => {
            if (value) {
              setValue('debitCcy', value);
              if (getValues().creditCcy === value) {
                setValue('creditCcy', '');
              }
            }
          }}
          onAmountChange={(value) => {
            setValue('debitAmount', value);
          }}
        />

        <Controller
          name="instructionId"
          control={control}
          render={({ field }) => (
            <Field
              label={t('paymentMaintenance.instructionId')}
              validationMessage={errors?.instructionId?.message}
            >
              <Input
                {...field}
                contentBefore={
                  <Text weight="bold">{getInstructionIdPrefix()}&nbsp;</Text>
                }
                disabled={
                  siteValue.length === 0 ||
                  paymentState.activeRecord !== undefined
                }
                maxLength={maxAccountLength}
              />
            </Field>
          )}
        />

        <Controller
          name="executeDate"
          control={control}
          render={({ field }) => (
            <Field
              label={t('paymentMaintenance.executeDate')}
              validationMessage={errors?.instructionId?.message}
            >
              <DatePicker
                {...field}
                formatDate={formatDateDDMMYYYY}
                parseDateFromString={(str) => parseDateMMDDYYYY(str) ?? null}
                disabled={paymentState.activeRecord !== undefined}
              />
            </Field>
          )}
        />

        <Controller
          name="fxRef"
          control={control}
          render={({ field }) => (
            <Field
              label={t('paymentMaintenance.fxRef')}
              validationMessage={errors?.instructionId?.message}
            >
              <Input
                {...field}
                contentAfter={
                  <Button
                    appearance="transparent"
                    size="small"
                    disabled={fxRefValue?.length === 0}
                    icon={<DocumentSearchRegular />}
                    onClick={() =>
                      handlePopulateDeal(
                        field.value!,
                        siteValue ? [siteValue] : entitledSiteCode
                      )
                    }
                  ></Button>
                }
                disabled={
                  siteValue.length === 0 ||
                  paymentState.activeRecord !== undefined
                }
              />
            </Field>
          )}
        />
        <EmptyCell />
      </Form>
      <div style={{ flex: 1 }}>
        {isNewPayment ? (
          <></>
        ) : (
          <Memo
            historyMemo={payment?.memo}
            onAddMemo={handleAddMemo}
            readOnly={false}
          />
        )}
      </div>

      <AccountSearchDrawer
        siteList={entitledSiteCode}
        isOpen={isAccountDrawerOpen}
        onDrawerClose={() => toggleDrawer('account')}
        onAccountSelect={(account) => {
          setValue('account', account.code);
          setValue('site', account.site);
          paymentAction({ selectAccount: { account } });
          toggleDrawer('account');
        }}
        title={t('paymentMaintenance.account')}
        t={t}
      />
    </Root>
  );
};
