import { useEffect, useState } from 'react';
import {
  tokens,
  ToolbarButton,
  Input,
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
import { currencyAtom } from '../../states/currency';
import { atom, useAtom } from 'jotai';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emptyStringToUndefined } from '../../utils/object-util';
import { Language } from '../../models/system';
import { SearchCriteriaDrawer } from '../../components/Drawer';
import { useStartBreadcrumb } from '../../contexts/PageElementNavigation';
import { Form, Root } from '../../components/Container';
import { Field } from '../../components/Field';
import { logger } from '../../utils/logging-util';

const searchSchema = z.object({
  code: z.preprocess((val) => emptyStringToUndefined(val), z.string().default('')),
  name: z.preprocess((val) => emptyStringToUndefined(val), z.string().default('')),
});

const emptyObject = searchSchema.parse({});

type SearchFormData = z.infer<typeof searchSchema>;

type SearchDrawerProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  t: TFunction;
};

const SearchDrawer = ({ t, isOpen, onOpenChange }: SearchDrawerProps) => {
  const [state, action] = useAtom(currencyAtom);

  const { control, reset, getValues, handleSubmit } = useForm<SearchFormData>({
    defaultValues: { ...emptyObject, ...state.payload },
    resolver: zodResolver(searchSchema),
  });

  return (
    <SearchCriteriaDrawer
      isOpen={isOpen}
      onClear={() => reset(emptyObject)}
      onDrawerClose={() => onOpenChange(false)}
      onSearch={handleSubmit(() => {
        const formData = getValues();
        logger.info(`Start search currency with criteria ${JSON.stringify(formData)}`);
        action({
          search: {
            offset: 0,
            pageSize: 25,
            code: formData?.code,
            name: formData?.name,
          },
        });
      })}
      t={t}
    >
      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <Field label={t('currencyMaintenance.code')} orientation="horizontal">
            <Input {...field} />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field label={t('currencyMaintenance.name')} orientation="horizontal">
            <Input {...field} />
          </Field>
        )}
      />
    </SearchCriteriaDrawer>
  );
};

type Item = {
  code: string;
  shortName: string;
  name: string;
  precision: number;
};

const columns: TableColumnDefinition<Item>[] = [
  createTableColumn<Item>({
    columnId: 'code',
  }),
  createTableColumn<Item>({
    columnId: 'shortName',
  }),
  createTableColumn<Item>({
    columnId: 'name',
  }),
  createTableColumn<Item>({
    columnId: 'precision',
  }),
];

type CurrencySearchPageProps = {
  onAddButtonClick: () => void;
  onEditButtonClick: () => void;
  onViewButtonClick: () => void;
};

const drawerOpenAtom = atom(false);

export const CurrencySearchPage: React.FC<CurrencySearchPageProps> = (
  props: CurrencySearchPageProps,
) => {
  const [isDrawerOpen, setIsDrawerOpen] = useAtom(drawerOpenAtom);
  const [state, action] = useAtom(currencyAtom);
  const [selectedCcyCode, setSelectedCcyCode] = useState<string | undefined>(
    state.activeRecord?.code,
  );
  const { t } = useTranslation();

  const items = (state.resultSet ?? []).map((i) => ({
    code: i.code,
    precision: i.precision,
    name: i.name[Language.English] ?? '',
    shortName: i.shortName[Language.English] ?? '',
  }));

  const { getRows } = useTableFeatures({
    columns,
    items,
  });

  const rows = getRows((row) => {
    const selected = selectedCcyCode === row.item.code;
    return {
      ...row,
      onClick: (_e: React.MouseEvent) => setSelectedCcyCode(selected ? undefined : row.item.code),
      selected,
      appearance: selected ? ('brand' as const) : ('none' as const),
    };
  });

  useEffect(() => {
    if (state.isResultSetDirty) {
      action({ refresh: {} });
    }
  }, [state.isResultSetDirty, action]);

  useStartBreadcrumb('currencyMaintenance.title');

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
        action({ new: {} });
        props.onAddButtonClick();
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
      disabled={selectedCcyCode === undefined}
      icon={<EditRegular />}
      onClick={() => {
        if (selectedCcyCode) {
          action({ edit: { code: selectedCcyCode } });
          props.onEditButtonClick();
        }
      }}
    />
  );

  const toolbarButtonView = (
    <ToolbarButton
      aria-label="View"
      disabled={selectedCcyCode === undefined}
      icon={<EyeRegular />}
      onClick={() => {
        if (selectedCcyCode) {
          action({ view: { code: selectedCcyCode } });
          props.onViewButtonClick();
        }
      }}
    />
  );

  return (
    <Root>
      <SearchDrawer isOpen={isDrawerOpen} onOpenChange={(open) => setIsDrawerOpen(open)} t={t} />

      <Form
        numColumn={1}
        title={t('currencyMaintenance.title')}
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
                <TableSelectionCell invisible type="radio" />
                {columns.map((column) => (
                  <TableHeaderCell key={column.columnId}>
                    <TableCellLayout appearance="primary">
                      <span style={{ color: tokens.colorBrandForeground1 }}>
                        {t(`currencyMaintenance.${column.columnId}`)}
                      </span>
                    </TableCellLayout>
                  </TableHeaderCell>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map(({ item, selected, onClick, appearance }) => (
                <TableRow
                  key={item.code}
                  appearance={appearance}
                  aria-selected={selected}
                  onClick={onClick}
                >
                  <TableSelectionCell
                    checked={selected}
                    type="radio"
                    // radioIndicator={{ 'aria-label': 'Select row' }}
                  />
                  <TableCell>{item.code}</TableCell>
                  <TableCell>{item.shortName}</TableCell>
                  <TableCell>{item.name}</TableCell>
                  <TableCell>{item.precision}</TableCell>
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
