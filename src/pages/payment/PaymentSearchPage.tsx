import { useContext, useEffect, useState } from 'react';
import {
  tokens,
  ToolbarButton,
  Input,
  Option,
  Table,
  TableBody,
  TableCell,
  TableCellLayout,
  TableHeader,
  TableHeaderCell,
  TableRow,
  TableSelectionCell,
  useTableFeatures,
  createTableColumn,
  TableColumnDefinition,
  Combobox,
  TableColumnId,
} from '@fluentui/react-components';
import {
  AddCircleRegular,
  ArrowClockwiseRegular,
  EditRegular,
  EyeRegular,
  FilterRegular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { TFunction } from 'i18next';
import { atom, useAtom, useAtomValue } from 'jotai';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  emptyStringToUndefined,
  undefinedToEmptyString,
} from '../../utils/objectUtil';
import { SearchCriteriaDrawer } from '../../components/Drawer';
import { PageElementNavigationContext } from '../../contexts/PageElementNavigation';
import { Form, Root } from '../../components/Container';
import { Field } from '../../components/Field';
import { paymentAtom, SearchPaymentPayload } from '../../states/payment';
import { entitledSiteAtom } from '../../states/entitledSite';
import { Payment, PaymentDirection, PaymentStatus } from '../../models/payment';
import { formatNumber } from '../../utils/stringUtil';
import { formatDateDDMMYYYY } from '../../utils/dateUtil';
import { PaymentStatusLabel } from './PaymentStatusComponent';

const searchSchema = z.object({
  site: z.array(z.string()).default([]),
  account: z.preprocess(
    (val) => emptyStringToUndefined(val),
    z.string().default('')
  ),
  executeDateFrom: z.date().optional(),
  executeDateTo: z.date().optional(),
  instructionId: z.preprocess(
    (val) => emptyStringToUndefined(val),
    z.string().default('')
  ),
  fxRef: z.preprocess(
    (val) => emptyStringToUndefined(val),
    z.string().default('')
  ),
});

const emptyObject = searchSchema.parse({});

type SearchFormData = z.infer<typeof searchSchema>;

type SearchDrawerProps = {
  isOpen: boolean;
  siteList: string[];
  onOpenChange: (isOpen: boolean) => void;
  t: TFunction;
};

const SearchDrawer = ({
  t,
  isOpen,
  siteList,
  onOpenChange,
}: SearchDrawerProps) => {
  const [{ payload }, action] = useAtom(paymentAtom);

  const payloadToFormData = (payload?: SearchPaymentPayload) => {
    return {
      site: payload?.site ?? [],
      account: undefinedToEmptyString(payload?.account),
      instructionId: undefinedToEmptyString(payload?.instructionId),
    };
  };

  const formDataToPayload = (formData: SearchFormData) => {
    return {
      offset: 0,
      pageSize: 25,
      site: formData.site.length === 0 ? undefined : formData.site,
      account: emptyStringToUndefined(formData.account),
      instructionId: emptyStringToUndefined(formData.instructionId),
    };
  };

  const { control, reset, getValues, handleSubmit, setValue } =
    useForm<SearchFormData>({
      defaultValues: payloadToFormData(payload),
      resolver: zodResolver(searchSchema),
    });

  useEffect(() => {
    reset(payloadToFormData(payload));
  }, [reset, payload]);

  return (
    <SearchCriteriaDrawer
      isOpen={isOpen}
      onDrawerClose={() => onOpenChange(false)}
      onClear={() => reset(emptyObject)}
      onSearch={handleSubmit(() => {
        const formData = getValues();
        action({
          searchPayment: formDataToPayload(formData),
        });
      })}
      t={t}
    >
      <Controller
        name="site"
        control={control}
        render={({ field }) => (
          <Field label={t('paymentMaintenance.site')}>
            <Combobox
              {...field}
              value={(field.value ?? []).join(',')}
              multiselect
              selectedOptions={field.value}
              onOptionSelect={(_ev, data) => {
                setValue(field.name, data.selectedOptions);
              }}
            >
              {siteList.map((item) => (
                <Option key={item}>{item}</Option>
              ))}
            </Combobox>
          </Field>
        )}
      />

      <Controller
        name="account"
        control={control}
        render={({ field }) => {
          return (
            <Field label={t('paymentMaintenance.account')}>
              <Input {...field} />
            </Field>
          );
        }}
      />

      <Controller
        name="instructionId"
        control={control}
        render={({ field }) => {
          return (
            <Field label={t('paymentMaintenance.instructionId')}>
              <Input {...field} />
            </Field>
          );
        }}
      />
    </SearchCriteriaDrawer>
  );
};

type Item = {
  site: string;
  instructionId: string;
  account: string;
  status: PaymentStatus;
  executeDate: Date;
  direction: PaymentDirection;
  creditCcy: string;
  creditAmount?: number;
  debitCcy: string;
  debitAmount?: number;
  backedPayment: Payment;
};

const paymentToItem = (payment: Payment): Item => {
  const { creditAmount, debitAmount, ...others } = payment;
  return {
    ...others,
    creditCcy: creditAmount.ccy,
    creditAmount: creditAmount.value,
    debitCcy: debitAmount.ccy,
    debitAmount: debitAmount.value,
    backedPayment: payment,
  };
};

const columns: TableColumnDefinition<Item>[] = [
  createTableColumn<Item>({
    columnId: 'site',
  }),
  createTableColumn<Item>({
    columnId: 'instructionId',
  }),
  createTableColumn<Item>({
    columnId: 'account',
  }),
  createTableColumn<Item>({
    columnId: 'status',
  }),
  createTableColumn<Item>({
    columnId: 'executeDate',
  }),
  createTableColumn<Item>({
    columnId: 'direction',
  }),
  createTableColumn<Item>({
    columnId: 'bankBuyCcy',
  }),
  createTableColumn<Item>({
    columnId: 'bankBuyAmount',
  }),
  createTableColumn<Item>({
    columnId: 'bankSellCcy',
  }),
  createTableColumn<Item>({
    columnId: 'bankSellAmount',
  }),
];

type PaymentSearchPageProps = {
  onAddButtonPress: () => void;
  onEditButtonPress: (payment: Payment) => void;
  onViewButtonPress: (payment: Payment) => void;
};

const drawerOpenAtom = atom(false);

export const PaymentSearchPage: React.FC<PaymentSearchPageProps> = (
  props: PaymentSearchPageProps
) => {
  const [isDrawerOpen, setIsDrawerOpen] = useAtom(drawerOpenAtom);
  const entitledSiteState = useAtomValue(entitledSiteAtom);
  const [state, action] = useAtom(paymentAtom);
  const [selectedPayment, setSelectedPayment] = useState<Item | undefined>(
    state.activeRecord ? paymentToItem(state.activeRecord) : undefined
  );
  const { t } = useTranslation();
  const navigationCtx = useContext(PageElementNavigationContext);

  const items = (state.resultSet ?? []).map((p) => paymentToItem(p));

  const { getRows } = useTableFeatures({
    columns,
    items,
  });

  const rows = getRows((row) => {
    const selected = selectedPayment?.instructionId === row.item.instructionId;
    return {
      ...row,
      onClick: (e: React.MouseEvent) =>
        setSelectedPayment(selected ? undefined : row.item),
      selected,
      appearance: selected ? ('brand' as const) : ('none' as const),
    };
  });

  useEffect(() => {
    if (state.isResultSetDirty) {
      action({ refresh: {} });
    }
  }, [state.isResultSetDirty, action]);

  useEffect(() => {
    // append breadcrumb
    const labelKey = 'paymentMaintenance.title';
    if (!navigationCtx.popPageElementNavigationTill(labelKey)) {
      navigationCtx.startPageElementNavigation(labelKey);
    }
  }, [navigationCtx]);

  const entitledSiteCode = (entitledSiteState.resultSet?.entitledSite ?? [])
    .filter((item) => item.selected)
    .map((item) => item.site.code)
    .sort((e1, e2) => e1.localeCompare(e2));

  const toolbarButtonRefresh = (
    <ToolbarButton
      aria-label="Refresh"
      disabled={state.resultSet === undefined}
      icon={<ArrowClockwiseRegular />}
      onClick={() => {
        action({ refresh: {} });
      }}
    />
  );

  const toolbarButtonAdd = (
    <ToolbarButton
      aria-label="Add"
      icon={<AddCircleRegular />}
      onClick={() => {
        action({ newPayment: {} });
        props.onAddButtonPress();
      }}
    />
  );

  const toolbarButtonFilter = (
    <ToolbarButton
      aria-label="Filter"
      icon={<FilterRegular />}
      onClick={() => setIsDrawerOpen(!isDrawerOpen)}
    />
  );

  const toolbarButtonEdit = (
    <ToolbarButton
      aria-label="Edit"
      disabled={
        selectedPayment === undefined ||
        ![PaymentStatus.New, PaymentStatus.Started].includes(
          selectedPayment.status
        )
      }
      icon={<EditRegular />}
      onClick={() => {
        if (selectedPayment) {
          action({
            getPayment: {
              site: selectedPayment.site,
              instructionId: selectedPayment.instructionId,
            },
          });
          props.onEditButtonPress(selectedPayment.backedPayment);
        }
      }}
    />
  );

  const toolbarButtonView = (
    <ToolbarButton
      aria-label="View"
      disabled={selectedPayment === undefined}
      icon={<EyeRegular />}
      onClick={() => {
        if (selectedPayment) {
          action({
            getPayment: {
              site: selectedPayment.site,
              instructionId: selectedPayment.instructionId,
            },
          });
          props.onViewButtonPress(selectedPayment.backedPayment);
        }
      }}
    />
  );

  const columnHeader: Record<TableColumnId, string> = {
    direction: t('paymentMaintenance.direction.label'),
    status: t('paymentMaintenance.status.label'),
    bankBuyAmount: t('paymentMaintenance.amount'),
    bankSellAmount: t('paymentMaintenance.amount'),
  };
  return (
    <Root>
      <SearchDrawer
        isOpen={isDrawerOpen}
        onOpenChange={(open) => setIsDrawerOpen(open)}
        siteList={entitledSiteCode}
        t={t}
      />

      <Form
        numColumn={1}
        title={t('paymentMaintenance.title')}
        toolbarSlot={[
          toolbarButtonFilter,
          toolbarButtonRefresh,
          toolbarButtonAdd,
          toolbarButtonEdit,
          toolbarButtonView,
        ]}
      >
        {state.resultSet ? (
          <Table arial-label="Default table" style={{ minWidth: '510px' }}>
            <TableHeader>
              <TableRow style={{ background: tokens.colorNeutralBackground2 }}>
                <TableSelectionCell type="radio" invisible />
                {columns.map((column) => (
                  <TableHeaderCell key={column.columnId}>
                    <TableCellLayout appearance="primary">
                      <span style={{ color: tokens.colorBrandForeground1 }}>
                        {columnHeader[column.columnId] ??
                          t(`paymentMaintenance.${column.columnId}`)}
                      </span>
                    </TableCellLayout>
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ item, selected, onClick, appearance }) => (
                <TableRow
                  key={item.instructionId}
                  onClick={onClick}
                  aria-selected={selected}
                  appearance={appearance}
                >
                  <TableSelectionCell checked={selected} type="radio" />
                  <TableCell>{item.site}</TableCell>
                  <TableCell>{item.instructionId}</TableCell>
                  <TableCell>{item.account}</TableCell>
                  <TableCell>
                    <PaymentStatusLabel paymentStatus={item.status} />
                  </TableCell>
                  <TableCell>{formatDateDDMMYYYY(item.executeDate)}</TableCell>
                  <TableCell>
                    {t(
                      `paymentMaintenance.direction.value.${item.direction.toString()}`
                    )}
                  </TableCell>
                  <TableCell>{item.creditCcy}</TableCell>
                  <TableCell>{formatNumber(item.creditAmount)}</TableCell>
                  <TableCell>{item.debitCcy}</TableCell>
                  <TableCell>{formatNumber(item.debitAmount)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <span>{t('system.message.noSearchPerformed')}</span>
        )}
      </Form>
    </Root>
  );
};
