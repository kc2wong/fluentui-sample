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
  useTableColumnSizing_unstable,
  Text,
  Tooltip,
  makeStyles,
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
import { atom, useAtom } from 'jotai';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emptyStringToUndefined } from '../../utils/object-util';
import { SearchCriteriaDrawer } from '../../components/Drawer';
import { useStartBreadcrumb } from '../../contexts/PageElementNavigation';
import { functionGroupAtom } from '../../states/function-group';
import { Form, Root } from '../../components/Container';
import { Field } from '../../components/Field';

const useStyles = makeStyles({
  tooltip: {
    whiteSpace: 'pre-line',
  },
});

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
  const [state, action] = useAtom(functionGroupAtom);

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
      {/* <div className={commonStyles.form}> */}
      <Controller
        control={control}
        name="code"
        render={({ field }) => (
          <Field label={t('functionGroupMaintenance.code')} orientation="horizontal">
            <Input {...field} />
          </Field>
        )}
      />

      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field label={t('functionGroupMaintenance.name')} orientation="horizontal">
            <Input {...field} />
          </Field>
        )}
      />
      {/* </div> */}
    </SearchCriteriaDrawer>
  );
};

type Item = {
  code: string;
  name: string;
};

const columnSizingOptions = {
  code: {
    minWidth: 50,
    idealWidth: 50,
  },
  name: {
    minWidth: 150,
    defaultWidth: 150,
  },
  'entitlement.site': {
    minWidth: 200,
    defaultWidth: 200,
  },
  'entitlement.function': {
    minWidth: 300,
    defaultWidth: 300,
  },
};

const columns: TableColumnDefinition<Item>[] = [
  createTableColumn<Item>({
    columnId: 'code',
  }),
  createTableColumn<Item>({
    columnId: 'name',
  }),
  createTableColumn<Item>({
    columnId: 'entitlement.site',
  }),
  createTableColumn<Item>({
    columnId: 'entitlement.function',
  }),
];

type FunctionGroupSearchPageProps = {
  onAddButtonPressed: () => void;
  onEditButtonPressed: () => void;
  onViewButtonPressed: () => void;
};

const drawerOpenAtom = atom(false);

export const FunctionGroupSearchPage: React.FC<FunctionGroupSearchPageProps> = (
  props: FunctionGroupSearchPageProps,
) => {
  const styles = useStyles();
  const [isDrawerOpen, setIsDrawerOpen] = useAtom(drawerOpenAtom);
  const [state, action] = useAtom(functionGroupAtom);
  const [selectedCcyCode, setSelectedCcyCode] = useState<string | undefined>(
    state.activeRecord?.code,
  );
  const { t } = useTranslation();

  const items = (state.resultSet ?? []).map((i) => ({
    code: i.code,
    name: i.name,
    sites: i.entitledSites.join(','),
    funtions: i.entitledFunctions
      .map((item) => t(`system.menu.${item.id}`))
      .sort()
      .join(', '),
  }));

  const { getRows, columnSizing_unstable, tableRef } = useTableFeatures(
    {
      columns,
      items,
    },
    [
      useTableColumnSizing_unstable({
        columnSizingOptions,
        autoFitColumns: false,
      }),
    ],
  );

  const rows = getRows((row) => {
    const selected = selectedCcyCode === row.item.code;
    return {
      ...row,
      onClick: (_ev: React.MouseEvent) => setSelectedCcyCode(selected ? undefined : row.item.code),
      selected,
      appearance: selected ? ('brand' as const) : ('none' as const),
    };
  });

  useEffect(() => {
    if (state.isResultSetDirty) {
      action({ refresh: {} });
    }
  }, [state.isResultSetDirty, action]);

  useStartBreadcrumb('functionGroupMaintenance.title');

  const toolbarButtonFilter = (
    <ToolbarButton
      aria-label="Filter"
      icon={<FilterRegular />}
      onClick={() => setIsDrawerOpen(!isDrawerOpen)}
    />
  );
  const toolbarButtonFilterRefresh = (
    <ToolbarButton
      aria-label="Refresh"
      disabled={state.resultSet === undefined}
      icon={<ArrowClockwiseRegular />}
      onClick={() => {
        action({ refresh: {} });
      }}
    />
  );
  const toolbarButtonFilterAdd = (
    <ToolbarButton
      aria-label="Add"
      icon={<AddCircleRegular />}
      onClick={() => {
        action({ new: {} });
        props.onAddButtonPressed();
      }}
    />
  );
  const toolbarButtonFilterEdit = (
    <ToolbarButton
      aria-label="Edit"
      disabled={selectedCcyCode === undefined}
      icon={<EditRegular />}
      onClick={() => {
        if (selectedCcyCode) {
          action({ edit: { code: selectedCcyCode } });
          props.onEditButtonPressed();
        }
      }}
    />
  );
  const toolbarButtonFilterView = (
    <ToolbarButton
      aria-label="View"
      disabled={selectedCcyCode === undefined}
      icon={<EyeRegular />}
      onClick={() => {
        if (selectedCcyCode) {
          action({ view: { code: selectedCcyCode } });
          props.onViewButtonPressed();
        }
      }}
    />
  );

  return (
    <Root>
      <SearchDrawer isOpen={isDrawerOpen} onOpenChange={(open) => setIsDrawerOpen(open)} t={t} />

      <Form
        numColumn={1}
        title={t('functionGroupMaintenance.title')}
        toolbarSlot={[
          toolbarButtonFilter,
          toolbarButtonFilterRefresh,
          toolbarButtonFilterAdd,
          toolbarButtonFilterEdit,
          toolbarButtonFilterView,
        ]}
      >
        {state.resultSet ? (
          <Table
            ref={tableRef}
            arial-label="Default table"
            style={{ minWidth: '500px' }}
            {...columnSizing_unstable.getTableProps()}
          >
            <TableHeader>
              <TableRow style={{ background: tokens.colorNeutralBackground2 }}>
                <TableSelectionCell invisible type="radio" />
                {columns.map((column) => (
                  <TableHeaderCell
                    key={column.columnId}
                    {...columnSizing_unstable.getTableHeaderCellProps(column.columnId)}
                  >
                    <TableCellLayout appearance="primary" truncate>
                      <span style={{ color: tokens.colorBrandForeground1 }}>
                        {t(`functionGroupMaintenance.${column.columnId}`)}
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
                  <TableSelectionCell checked={selected} type="radio" />
                  <TableCell {...columnSizing_unstable.getTableCellProps('code')}>
                    {item.code}
                  </TableCell>
                  <TableCell {...columnSizing_unstable.getTableCellProps('name')}>
                    {item.name}
                  </TableCell>
                  <TableCell {...columnSizing_unstable.getTableCellProps('entitlement.site')}>
                    {item.sites}
                  </TableCell>
                  <TableCell {...columnSizing_unstable.getTableCellProps('entitlement.function')}>
                    <Tooltip
                      content={{
                        children: item.funtions.replaceAll(', ', '\u000a'),
                        className: styles.tooltip,
                      }}
                      relationship="description"
                    >
                      <Text truncate>{item.funtions}</Text>
                    </Tooltip>
                  </TableCell>
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
