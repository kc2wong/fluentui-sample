import React, { useRef } from 'react';
import { useEffect, useState } from 'react';
import {
  Accordion,
  AccordionHeader,
  AccordionItem,
  AccordionPanel,
  Button,
  Checkbox,
  Label,
  makeStyles,
  Switch,
  Tab,
  TabList,
  TabValue,
  tokens,
  Tooltip,
  Tree,
  TreeItem,
  TreeItemLayout,
  TreeItemValue,
} from '@fluentui/react-components';
import {
  AddSquareRegular,
  ArrowTurnUpLeftRegular,
  CheckmarkRegular,
  DismissRegular,
  SaveRegular,
  SubtractSquare16Regular,
} from '@fluentui/react-icons';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { TFunction } from 'i18next';
import { useAtomValue } from 'jotai';
import { Control, Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emptyStringToUndefined, undefinedToEmptyString } from '../../utils/object-util';
import { constructMessage } from '../../utils/string-util';
import { Language } from '../../models/system';
import { Field } from '../../components/Field';
import { useAppendBreadcrumb } from '../../contexts/PageElementNavigation';
import { Site } from '../../models/site';
import { sharedDataAtom } from '../../states/shared-data';
import { FunctionAccess, FunctionTree } from '../../models/function-entitlement';
import { functionGroupAtom } from '../../states/function-group';
import { Form, Root } from '../../components/Container';
import { useFormDirty } from '../../contexts/FormDirty';
import { Input } from '../../components/Input';
import { EmptyCell } from '../../components/EmptyCell';
import { useDialog } from '../../contexts/Dialog';
import { hasMissingRequiredField } from '../../utils/form-util';

const useStyles = makeStyles({
  tab: {
    alignItems: 'flex-start',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-start',
    border: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
  },
  regionColumn: {
    width: '100%',
  },
  siteRow: {
    display: 'flex',
    flexWrap: 'wrap',
    boxSizing: 'border-box',
    borderBottom: `${tokens.strokeWidthThin} solid ${tokens.colorNeutralStroke2}`,
    paddingBottom: tokens.spacingVerticalS,
    marginBottom: tokens.spacingVerticalS,
  },
  actionRow: {
    display: 'flex',
    flexWrap: 'wrap',
    boxSizing: 'border-box',
    minWidth: '400px',
  },
  cell: {
    flex: '0 0 calc(25%)',
  },
  panels: {
    width: '100%',
    '& th': {
      textAlign: 'left',
    },
  },
});

const getLabel = (t: TFunction, id: string, defaultLabel: string) => {
  const label = t(id);
  return label === id ? defaultLabel : label;
};

const FunctionEntitlementTree: React.FC<{
  control: Control<FormData>;
  node: FunctionTree;
  functionTreeId: 'operatorFunctionIds' | 'administratorFunctionIds';
  expandedNode: TreeItemValue[];
  t: TFunction;
  readOnly: boolean;
}> = ({ control, t, node, functionTreeId, expandedNode, readOnly }) => {
  const styles = useStyles();
  const label = getLabel(t, `system.menu.${node.id}`, node.id);
  const children = 'children' in node ? node.children : [];
  const action = 'action' in node ? (node as FunctionAccess).action : [];

  return (
    <TreeItem itemType="branch" value={node.id}>
      <TreeItemLayout
        expandIcon={
          expandedNode.includes(node.id) ? <SubtractSquare16Regular /> : <AddSquareRegular />
        }
      >
        {label}
      </TreeItemLayout>
      <Tree>
        {action.length > 0 ? (
          <TreeItem itemType="leaf">
            <TreeItemLayout>
              <div className={styles.actionRow}>
                {action.map((a) => {
                  const funcId = `${node.id}.${a}`;
                  return (
                    <Controller
                      key={funcId}
                      control={control}
                      name={functionTreeId}
                      render={({ field }) => (
                        <Checkbox
                          checked={field.value.includes(funcId)}
                          className={styles.cell}
                          label={a}
                          onChange={
                            readOnly
                              ? undefined
                              : (_ev, data) => {
                                  if (data.checked === true) {
                                    field.onChange([...field.value, funcId]);
                                  } else {
                                    field.onChange(field.value.filter((v) => v !== funcId));
                                  }
                                }
                          }
                        />
                      )}
                    />
                  );
                })}
              </div>
            </TreeItemLayout>
          </TreeItem>
        ) : (
          <>
            {children.map((c) => (
              <FunctionEntitlementTree
                key={c.id}
                control={control}
                expandedNode={expandedNode}
                functionTreeId={functionTreeId}
                node={c as FunctionTree}
                readOnly={readOnly}
                t={t}
              />
            ))}
          </>
        )}
      </Tree>
    </TreeItem>
  );
};

const FunctionEntitlementAccordion: React.FC<{
  functionTreeId: string;
  openedAccordion: string[];
  onAccordionClick: (value: string, open: boolean) => void;
  openedTreeNode: TreeItemValue[];
  onTreeNodeClick: (item: TreeItemValue, open: boolean) => void;
  control: Control<FormData>;
  readOnly: boolean;
}> = ({ functionTreeId, openedTreeNode, onTreeNodeClick, control, readOnly }) => {
  const { t } = useTranslation();
  const sharedDataState = useAtomValue(sharedDataAtom);
  const treeNode = sharedDataState.resultSet?.functionTree?.find(
    (item: { id: string }) => item.id === functionTreeId,
  );

  if (treeNode) {
    const children = treeNode && 'children' in treeNode ? treeNode.children : [];
    return (
      <AccordionPanel>
        <Tree
          aria-label="mainMenu"
          onOpenChange={(_ev, data) => {
            onTreeNodeClick(data.value, data.open);
          }}
          openItems={openedTreeNode}
        >
          {children.map((item) => (
            <FunctionEntitlementTree
              key={item.id}
              control={control}
              expandedNode={openedTreeNode}
              functionTreeId={
                functionTreeId === 'administrator'
                  ? 'administratorFunctionIds'
                  : 'operatorFunctionIds'
              }
              node={item as FunctionTree}
              readOnly={readOnly}
              t={t}
            />
          ))}
        </Tree>
      </AccordionPanel>
    );
  } else {
    return (
      <AccordionPanel>
        <span>Function entitlement is not available</span>
      </AccordionPanel>
    );
  }
};

const EntitlementTabPage: React.FC<{
  control: Control<FormData>;
  openedAccordion: string[];
  toggleAccordionOpen: (value: string, open: boolean) => void;
  siteEntitlementConfig?: {
    language: Language;
    siteGroupedByRegion: Record<string, Site[]>;
  };
  functionEntitlementConfig?: {
    functionTreeId: string;
    openedTreeNode: TreeItemValue[];
    toggleTreeNodeOpen: (node: TreeItemValue, open: boolean) => void;
  };
  readOnly: boolean;
}> = ({
  control,
  openedAccordion,
  toggleAccordionOpen,
  siteEntitlementConfig,
  functionEntitlementConfig,
  readOnly,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();

  let siteEntlAccordion = <></>;
  if (siteEntitlementConfig) {
    const { siteGroupedByRegion, language } = siteEntitlementConfig;

    siteEntlAccordion = (
      <AccordionItem value="1">
        <AccordionHeader>{t('functionGroupMaintenance.entitlement.site')}</AccordionHeader>
        <AccordionPanel>
          <div>
            {Object.entries(siteGroupedByRegion).map((e) => {
              return (
                <div key={`region_${e}`} className={styles.regionColumn}>
                  <Controller
                    control={control}
                    name="operatorSites"
                    render={({ field }) => (
                      <>
                        <Switch
                          checked={e[1].reduce<boolean>(
                            (acc, item) => acc && field.value.includes(item.code),
                            true,
                          )}
                          label={e[0]}
                          labelPosition="after"
                          onChange={
                            readOnly
                              ? undefined
                              : (_ev, data) => {
                                  const siteOfRegion =
                                    siteGroupedByRegion[e[0]].map((s) => s.code) ?? [];
                                  const newValue = field.value.filter(
                                    (s) => !siteOfRegion.includes(s),
                                  );
                                  if (data.checked) {
                                    siteOfRegion.forEach((s) => newValue.push(s));
                                  }
                                  field.onChange(newValue);
                                }
                          }
                          value={e[0]}
                        ></Switch>
                        <div className={styles.siteRow}>
                          {e[1].map((s) => {
                            const siteName = s.name[language];
                            const siteLabel =
                              siteName === undefined ? (
                                <Label>{s.code}</Label>
                              ) : (
                                <Tooltip
                                  content={<Label>{siteName}</Label>}
                                  relationship="description"
                                >
                                  <Label>{s.code}</Label>
                                </Tooltip>
                              );
                            return (
                              <Checkbox
                                key={`checkbox_${s.code}`}
                                checked={field.value.includes(s.code)}
                                className={styles.cell}
                                label={siteLabel}
                                onChange={
                                  readOnly
                                    ? undefined
                                    : (_ev, data) => {
                                        if (data.checked === true) {
                                          field.onChange([...field.value, s.code]);
                                        } else {
                                          field.onChange(field.value.filter((v) => v !== s.code));
                                        }
                                      }
                                }
                                value={s.code}
                              />
                            );
                          })}
                        </div>
                      </>
                    )}
                  />
                </div>
              );
            })}
          </div>
        </AccordionPanel>
      </AccordionItem>
    );
  }

  const functionEntlAccordion = functionEntitlementConfig ? (
    <AccordionItem value="2">
      <AccordionHeader>{t('functionGroupMaintenance.entitlement.function')}</AccordionHeader>
      <FunctionEntitlementAccordion
        control={control}
        functionTreeId={functionEntitlementConfig.functionTreeId}
        onAccordionClick={toggleAccordionOpen}
        onTreeNodeClick={functionEntitlementConfig.toggleTreeNodeOpen}
        openedAccordion={openedAccordion}
        openedTreeNode={functionEntitlementConfig.openedTreeNode}
        readOnly={readOnly}
      />
    </AccordionItem>
  ) : (
    <></>
  );

  return (
    <Accordion
      collapsible
      multiple
      onToggle={(_ev, data) => {
        const openedItems = data.openItems;
        const selectedItem = data.value as string;
        toggleAccordionOpen(selectedItem, openedItems.includes(selectedItem));
      }}
      openItems={openedAccordion}
    >
      {siteEntlAccordion}
      {functionEntlAccordion}
    </Accordion>
  );
};

// form for editing role
const maxCodeLength = 10;
const maxNameLength = 50;
const missingFunctionIdErrorMessage = 'Function entitlement is required';
const schema = z
  .object({
    code: z.preprocess((val) => emptyStringToUndefined(val), z.string().max(maxCodeLength)),
    name: z.preprocess((val) => emptyStringToUndefined(val), z.string().max(maxNameLength)),
    operatorSites: z.array(z.string()),
    operatorFunctionIds: z.array(z.string()),
    administratorFunctionIds: z.array(z.string()),
  })
  .refine(
    (data) => data.operatorFunctionIds.length > 0 || data.administratorFunctionIds.length > 0,
    {
      message: missingFunctionIdErrorMessage,
      path: ['administratorFunctionIds'],
    },
  );

type FormData = z.infer<typeof schema>;

const collectLowestFunctionTrees = (tree: FunctionTree): FunctionAccess[] => {
  // Helper function to check if all children are FunctionAccess
  const allChildrenAreFunctionAccess = (children: (FunctionTree | FunctionAccess)[]): boolean => {
    return children.every((child) => 'action' in child);
  };

  // If all children are FunctionAccess, collect all children
  if (tree.children && allChildrenAreFunctionAccess(tree.children)) {
    return tree.children as FunctionAccess[];
  }

  // Otherwise, recursively collect from child nodes that are FunctionTree
  return (
    tree.children
      ?.filter((child) => 'children' in child) // Only process FunctionTree nodes
      .flatMap((child) => collectLowestFunctionTrees(child as FunctionTree)) || []
  );
};

type FunctionGroupEditPageProps = {
  readOnly: boolean;
  onBackButtonClick: () => void;
};

export const FunctionGroupEditPage: React.FC<FunctionGroupEditPageProps> = ({
  onBackButtonClick,
  readOnly,
}: FunctionGroupEditPageProps) => {
  const styles = useStyles();
  const { t, i18n } = useTranslation();
  const selectedLanguage = i18n.language === 'en' ? Language.English : Language.TraditionalChinese;
  const sharedDataState = useAtomValue(sharedDataAtom);

  const [activeTabPage, setActiveTabPage] = useState<TabValue>('administrator');
  // opened accordion in each tab
  const [openedAdminAccordion, setOpenedAdminAccordion] = useState<string[]>([]);
  const [openedOperatorAccordion, setOpenedOperatorAccordion] = useState<string[]>([]);

  // expanded function entitlement node in each tab
  const [openedAdminFuncEntl, setOpenedAdminFuncEntl] = useState<TreeItemValue[]>([]);
  const [openedOperatorFuncEntl, setOpenedOperatorFuncEntl] = useState<TreeItemValue[]>([]);

  const functionGroupState = useAtomValue(functionGroupAtom);
  const administratorFunctionAccess = useRef<string[]>(
    (sharedDataState.resultSet?.functionTree ?? [])
      .filter((item) => item.id === 'administrator')
      .flatMap((item) => collectLowestFunctionTrees(item))
      .map((node) => node.id),
  );
  const operatorFunctionAccess = useRef<string[]>(
    (sharedDataState.resultSet?.functionTree ?? [])
      .filter((item) => item.id === 'operator')
      .flatMap((item) => collectLowestFunctionTrees(item))
      .map((node) => node.id),
  );

  const activeRecord = functionGroupState.activeRecord;

  const initialData = {
    code: activeRecord?.code,
    name: activeRecord?.name,
    operatorSites: activeRecord?.entitledSites ?? [],
    operatorFunctionIds: (activeRecord?.entitledFunctions ?? [])
      .filter((item) => operatorFunctionAccess.current.includes(item.id))
      .flatMap((item) => item.action.map((a) => `${item.id}.${a}`)),
    administratorFunctionIds: (activeRecord?.entitledFunctions ?? [])
      .filter((item) => administratorFunctionAccess.current.includes(item.id))
      .flatMap((item) => item.action.map((a) => `${item.id}.${a}`)),
  };

  const { showConfirmationDialog } = useDialog();
  const { markDirty, resetDirty } = useFormDirty();

  const {
    control,
    setError,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      // initialize to empty string in order to keep as controlled field
      code: undefinedToEmptyString(initialData?.code),
      name: undefinedToEmptyString(initialData?.name),
      operatorSites: initialData.operatorSites,
      operatorFunctionIds: initialData.operatorFunctionIds,
      administratorFunctionIds: initialData.administratorFunctionIds,
    },
    resolver: zodResolver(schema),
  });

  const formValues = watch();
  useEffect(() => {
    // to trigger enable / disable of save button
    if (isDirty) {
      markDirty();
    }
    return () => resetDirty();
  }, [formValues, isDirty, markDirty, resetDirty]);

  const mode = functionGroupState.activeRecord
    ? readOnly
      ? 'system.message.view'
      : 'system.message.edit'
    : 'system.message.add';
  useAppendBreadcrumb('functionGroupMaintenance.titleEdit', mode, onBackButtonClick);

  const toggleAccordion = (
    id: string,
    checked: boolean,
    setter: React.Dispatch<React.SetStateAction<string[]>>,
  ) => {
    setter(checked ? [id] : []);
  };

  const toggleOpenedTreeNode = (
    toggledNode: TreeItemValue,
    open: boolean,
    openedNode: TreeItemValue[],
    setter: React.Dispatch<React.SetStateAction<TreeItemValue[]>>,
  ) => {
    const newOpenedNode = open
      ? [...openedNode, toggledNode]
      : openedNode.filter((v) => v !== toggledNode);
    setter(newOpenedNode);
  };

  const groupedByRegion = (sharedDataState.resultSet?.sites ?? [])
    .sort((s1, s2) => {
      const compareRegion = s1.region.localeCompare(s2.region);
      if (compareRegion === 0) {
        return s1.code.localeCompare(s2.code);
      } else {
        return compareRegion;
      }
    })
    .reduce<Record<string, Site[]>>((acc, item) => {
      const { region } = item;
      if (!acc[region]) {
        acc[region] = [];
      }
      acc[region].push(item);
      return acc;
    }, {});

  const backButton = (
    <Button icon={<ArrowTurnUpLeftRegular />} onClick={onBackButtonClick}>
      {t('system.message.back')}
    </Button>
  );

  const saveButton = (
    <Button
      appearance="primary"
      disabled={hasMissingRequiredField(
        formValues,
        schema,
        (issue) =>
          ['custom'].includes(issue.code) && issue.message === missingFunctionIdErrorMessage,
      )}
      icon={<SaveRegular />}
      onClick={handleSubmit(() => {
        showConfirmationDialog({
          confirmType: 'save',
          message: t('system.message.doYouWantToSaveChange'),
          primaryButton: {
            label: t('system.message.save'),
            icon: <CheckmarkRegular />,
            action: () => {
              const errorMessage = t(
                'system.error.functionGroupMaintenance.siteFunctionEntitlementRequired',
              );
              if (
                formValues.operatorFunctionIds.length > 0 &&
                formValues.operatorSites.length === 0
              ) {
                setError('operatorSites', { type: 'required', message: errorMessage });
                return;
              } else if (
                formValues.operatorSites.length > 0 &&
                formValues.operatorFunctionIds.length === 0
              ) {
                setError('operatorFunctionIds', {
                  type: 'required',
                  message: errorMessage,
                });
                return;
              }
            },
          },
          secondaryButton: {
            label: t('system.message.cancel'),
            icon: <DismissRegular />,
          },
        });
      })}
    >
      {t('system.message.save')}
    </Button>
  );

  return (
    <Root>
      <Form
        buttons={readOnly ? [backButton] : [backButton, saveButton]}
        numColumn={3}
        styles={{ width: '600px', maxWidth: '50vw' }}
        title={constructMessage(t, 'functionGroupMaintenance.titleEdit', [
          t('system.message.edit'),
        ])}
      >
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <Field
              label={t('functionGroupMaintenance.code')}
              required
              validationMessage={errors?.code?.message}
            >
              <Input
                {...field}
                maxLength={maxCodeLength}
                readOnly={readOnly || activeRecord !== undefined}
              />
            </Field>
          )}
        />
        <EmptyCell colSpan={2} />

        <Controller
          control={control}
          name="name"
          render={({ field }) => {
            return (
              <Field
                colSpan={3}
                label={t('functionGroupMaintenance.name')}
                required
                validationMessage={errors?.name?.message}
              >
                <Input {...field} maxLength={maxNameLength} readOnly={readOnly} />
              </Field>
            );
          }}
        />

        <Field
          colSpan={3}
          label={t('functionGroupMaintenance.entitlement.base')}
          required
          validationMessage={
            errors?.administratorFunctionIds?.message ??
            errors.operatorFunctionIds?.message ??
            errors.operatorSites?.message
          }
        >
          <div className={styles.tab}>
            <TabList
              appearance="subtle"
              onTabSelect={(_ev, data) => setActiveTabPage(data.value)}
              selectedValue={activeTabPage}
              size="small"
              style={{ width: '100px' }}
            >
              <Tab
                className={activeTabPage === 'administrator' ? 'activeTab' : undefined}
                value="administrator"
              >
                {t('system.mode.value.administrator')}
              </Tab>
              <Tab
                className={activeTabPage === 'operator' ? 'activeTab' : undefined}
                value="operator"
              >
                {t('system.mode.value.operator')}
              </Tab>
            </TabList>

            <div className={styles.panels}>
              {activeTabPage === 'administrator' && (
                <EntitlementTabPage
                  control={control}
                  functionEntitlementConfig={{
                    functionTreeId: 'administrator',
                    openedTreeNode: openedAdminFuncEntl,
                    toggleTreeNodeOpen: (node, open) =>
                      toggleOpenedTreeNode(node, open, openedAdminFuncEntl, setOpenedAdminFuncEntl),
                  }}
                  openedAccordion={openedAdminAccordion}
                  readOnly={readOnly}
                  toggleAccordionOpen={(id, checked) =>
                    toggleAccordion(id, checked, setOpenedAdminAccordion)
                  }
                />
              )}
              {activeTabPage === 'operator' && (
                <EntitlementTabPage
                  control={control}
                  functionEntitlementConfig={{
                    functionTreeId: 'operator',
                    openedTreeNode: openedOperatorFuncEntl,
                    toggleTreeNodeOpen: (node, open) =>
                      toggleOpenedTreeNode(
                        node,
                        open,
                        openedOperatorFuncEntl,
                        setOpenedOperatorFuncEntl,
                      ),
                  }}
                  openedAccordion={openedOperatorAccordion}
                  readOnly={readOnly}
                  siteEntitlementConfig={{
                    language: selectedLanguage,
                    siteGroupedByRegion: groupedByRegion,
                  }}
                  toggleAccordionOpen={(id, checked) =>
                    toggleAccordion(id, checked, setOpenedOperatorAccordion)
                  }
                />
              )}
            </div>
          </div>
        </Field>
      </Form>
    </Root>
  );
};
