import React from 'react';
import { useContext, useEffect, useState } from 'react';
import {
  Button,
  Input,
  SpinButton,
  SpinButtonChangeEvent,
  SpinButtonOnChangeData,
} from '@fluentui/react-components';
import {
  ArrowCircleLeftRegular,
  ArrowTurnUpLeftRegular,
  CheckmarkRegular,
  DismissRegular,
  SaveRegular,
  TranslateAutoRegular,
} from '@fluentui/react-icons';
import { ButtonPanel } from '../../components/ButtonPanel';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { TFunction } from 'i18next';
import { currencyAtom } from '../../states/currency';
import { useAtom } from 'jotai';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  emptyStringToUndefined,
  undefinedToEmptyString,
} from '../../utils/objectUtil';
import { constructMessage } from '../../utils/stringUtil';
import { Language, MessageType } from '../../models/system';
import { useStyles } from '../common';
import { Field } from '../../components/Field';
import { DetailEditingDrawer } from '../../components/Drawer';
import { PageElementNavigationContext } from '../../contexts/PageElementNavigation';
import { DialogContext } from '../../contexts/Dialog';

// form in drawer for editing multi language name or shortname
const nameMultiLangSchema = z.object(
  Object.values(Language).reduce((acc, lang) => {
    acc[lang] = z.preprocess(
      (val) => emptyStringToUndefined(val),
      z.string().default('')
    );
    return acc;
  }, {} as Record<string, z.ZodEffects<z.ZodDefault<z.ZodString>, string, unknown>>)
);
type NameMultiLangFormData = z.infer<typeof nameMultiLangSchema>;

type NameMultiLangDrawerProps = {
  initialData: Record<string, string | undefined>;
  isOpen: boolean;
  isReadOnly: boolean;
  onDrawerClose: () => void;
  onValueChange: (langStr: string, value: string) => void;
  title: string;
  t: TFunction;
};

const NameMultiLangDrawer = ({
  initialData,
  isOpen,
  isReadOnly,
  onDrawerClose,
  onValueChange,
  title,
  t,
}: NameMultiLangDrawerProps) => {
  const styles = useStyles();
  useForm<NameMultiLangFormData>({
    defaultValues: initialData,
    resolver: zodResolver(nameMultiLangSchema),
  });
  return (
    <DetailEditingDrawer
      isOpen={isOpen}
      onCloseDrawer={onDrawerClose}
      title={title}
      t={t}
    >
      <div className={styles.form}>
        {Object.values(Language).map((lang) => (
          <Field
            label={t(`system.language.value.${lang}`)}
            key={lang}
            required={lang === Language.English}
          >
            <Input
              defaultValue={initialData[lang]}
              name={lang}
              onChange={(e, v) => onValueChange(e.target.name, v.value)}
              readOnly={isReadOnly}
            />
          </Field>
        ))}
      </div>
    </DetailEditingDrawer>
  );
};

// form for editing currency
const maxCodeLength = 3;
const maxNameLength = 50;
const maxShortNameLength = 10;
const minPrecision = 0;
const maxPrecision = 5;
const schema = z.object({
  code: z.preprocess(
    (val) => emptyStringToUndefined(val),
    z.string().max(maxCodeLength)
  ),
  name: z
    .record(
      z.preprocess(
        (val) => emptyStringToUndefined(val),
        z.string().max(maxNameLength).optional()
      )
    )
    .refine(
      (data) =>
        data[Language.English] && data[Language.English].trim().length > 0,
      {
        message: 'Required',
        path: ['en'], // path of error
      }
    ),
  shortName: z
    .record(
      z.preprocess(
        (val) => emptyStringToUndefined(val),
        z.string().max(maxShortNameLength).optional()
      )
    )
    .refine(
      (data) =>
        data[Language.English] && data[Language.English].trim().length > 0,
      {
        message: 'Required',
        path: ['en'], // path of error
      }
    ),
  precision: z
    .number()
    .min(minPrecision)
    .max(maxPrecision)
    .default(minPrecision),
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

// button to toggle multi lang drawer
type NameMultiLangButtonProps = {
  isOpen: boolean;
  onClick: () => void;
};
const NameMultiLangButton: React.FC<NameMultiLangButtonProps> = (
  props: NameMultiLangButtonProps
) => {
  return (
    <Button
      {...props}
      appearance="transparent"
      icon={
        props.isOpen ? <ArrowCircleLeftRegular /> : <TranslateAutoRegular />
      }
      onClick={props.onClick}
      size="medium"
    />
  );
};

type CurrencyEditPageProps = {
  readOnly: boolean;
  onBackButtonPressed: () => void;
};

export const CurrencyEditPage: React.FC<CurrencyEditPageProps> = ({
  onBackButtonPressed,
  readOnly,
}: CurrencyEditPageProps) => {
  const styles = useStyles();
  const [isDrawerOpen, setIsDrawerOpen] = useState([false, false]); // shortName, name
  const { t } = useTranslation();

  const [currencyState, action] = useAtom(currencyAtom);
  const initialData = currencyState.activeRecord;

  const dialogCtx = useContext(DialogContext);
  const navigationCtx = useContext(PageElementNavigationContext);

  const {
    control,
    setValue,
    getValues,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      // initialize to empty string in order to keep as controlled field
      code: undefinedToEmptyString(initialData?.code),
      shortName: {
        ...nameMultiLangSchema.parse({}),
        ...(initialData?.shortName ?? {}),
      },
      name: { ...nameMultiLangSchema.parse({}), ...(initialData?.name ?? {}) },
      precision: initialData?.precision ?? minPrecision,
    },
    resolver: zodResolver(schema),
  });

  const formValues = watch();
  useEffect(() => {
    // to trigger enable / disable of save button
  }, [formValues]);

  useEffect(() => {
    // append breadcrumb
    const labelKey = 'currencyMaintenance.titleEdit';
    const mode = currencyState.activeRecord
      ? readOnly
        ? 'system.message.view'
        : 'system.message.edit'
      : 'system.message.add';
    if (!navigationCtx.popPageElementNavigationTill(labelKey, [mode])) {
      navigationCtx.appendPageElementNavigation(
        labelKey,
        [mode],
        onBackButtonPressed
      );
    }
  }, [currencyState.activeRecord, readOnly, onBackButtonPressed, navigationCtx]);

  const handleNameFieldChange = (
    fieldName: 'name' | 'shortName',
    langStr: string,
    value: string
  ) => {
    const currentFieldValues = getValues()[fieldName];

    currentFieldValues[
      langStr === Language.TraditionalChinese
        ? Language.TraditionalChinese
        : Language.English
    ] = value;

    setValue(fieldName, currentFieldValues);
  };

  const handlePrecisionChange = (
    e: SpinButtonChangeEvent,
    data: SpinButtonOnChangeData
  ) => {
    if (data.value) {
      setValue('precision', data.value);
    } else if ('value' in e.target) {
      // value entered directly
      setValue('precision', parseInt(e.target.value));
    }
  };

  // behaviour of components
  const isShortNameDrawerOpen = isDrawerOpen[0];
  const isNameDrawerOpen = isDrawerOpen[1];
  const toggleDrawer = (drawerType: 'name' | 'shortName') => {
    if (drawerType === 'shortName') {
      if (isNameDrawerOpen) {
        // close opened drawer first
        setIsDrawerOpen([false, false]);
        setTimeout(() => {
          setIsDrawerOpen([!isShortNameDrawerOpen, false]);
        }, 500);
      } else {
        setIsDrawerOpen([!isShortNameDrawerOpen, false]);
      }
    } else {
      if (isShortNameDrawerOpen) {
        // close opened drawer first
        setIsDrawerOpen([false, false]);
        setTimeout(() => {
          setIsDrawerOpen([false, !isNameDrawerOpen]);
        }, 500);
      } else {
        setIsDrawerOpen([false, !isNameDrawerOpen]);
      }
    }
  };

  return (
    <div className={styles.root}>
      <div className={styles.content}>
        <div className={styles.titleBar}>
          <span>
            {' '}
            {constructMessage(t, 'currencyMaintenance.titleEdit', [
              currencyState.activeRecord
                ? readOnly
                  ? t('system.message.view')
                  : t('system.message.edit')
                : t('system.message.add'),
            ])}
          </span>
        </div>
        <div className={styles.form}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <Field
                label={t('currencyMaintenance.code')}
                required
                validationMessage={errors?.code?.message}
              >
                <Input
                  {...field}
                  disabled={
                    readOnly ? undefined : currencyState.activeRecord !== undefined
                  }
                  readOnly={readOnly}
                  maxLength={maxCodeLength}
                />
              </Field>
            )}
          />

          <Controller
            name="shortName"
            control={control}
            render={({ field }) => {
              return (
                <Field
                  label={t('currencyMaintenance.shortName')}
                  required
                  validationMessage={errors?.shortName?.en?.message}
                >
                  <Input
                    name={field.name}
                    disabled={readOnly ? false : isShortNameDrawerOpen}
                    onChange={(evt, data) =>
                      handleNameFieldChange(
                        field.name,
                        evt.target.name,
                        data.value
                      )
                    }
                    value={field.value[Language.English]}
                    readOnly={readOnly}
                    contentAfter={
                      <NameMultiLangButton
                        isOpen={isShortNameDrawerOpen}
                        onClick={() => toggleDrawer('shortName')}
                      />
                    }
                  />
                </Field>
              );
            }}
          />

          <Controller
            name="name"
            control={control}
            render={({ field }) => {
              return (
                <Field
                  label={t('currencyMaintenance.name')}
                  required
                  validationMessage={errors?.name?.en?.message}
                >
                  <Input
                    name={field.name}
                    disabled={readOnly ? false : isShortNameDrawerOpen}
                    onChange={(evt, data) =>
                      handleNameFieldChange(
                        field.name,
                        evt.target.name,
                        data.value
                      )
                    }
                    value={field.value[Language.English]}
                    readOnly={readOnly}
                    contentAfter={
                      <NameMultiLangButton
                        isOpen={isNameDrawerOpen}
                        onClick={() => toggleDrawer('name')}
                      />
                    }
                  />
                </Field>
              );
            }}
          />

          <Controller
            name="precision"
            control={control}
            render={({ field }) => {
              const { value, ...others } = field;
              return (
                <Field
                  label={t('currencyMaintenance.precision')}
                  required
                  validationMessage={errors?.precision?.message}
                >
                  {readOnly ? (
                    <Input {...others} readOnly value={value.toString()} />
                  ) : (
                    <SpinButton
                      {...field}
                      min={minPrecision}
                      max={maxPrecision}
                      onChange={handlePrecisionChange}
                    />
                  )}
                </Field>
              );
            }}
          />

          <ButtonPanel className={styles.buttonPanel}>
            <Button
              icon={<ArrowTurnUpLeftRegular />}
              onClick={onBackButtonPressed}
            >
              {t('system.message.back')}
            </Button>
            {readOnly ? (
              <></>
            ) : (
              <Button
                appearance="primary"
                disabled={missingRequiredField(getValues())}
                onClick={handleSubmit(() => {
                  dialogCtx.showConfirmationDialog({
                    confirmType: 'save',
                    message: t('system.message.doYouWantToSaveChange'),
                    primaryButton: {
                      label: t('system.message.save'),
                      icon: <CheckmarkRegular />,
                      action: () => {
                        action({
                          save: {
                            currency: { ...initialData, ...getValues() },
                            successMessage: {
                              key: 'system.message.saveObjectSuccess',
                              type: MessageType.Success,
                              parameters: ['Currency', formValues.code],
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
                icon={<SaveRegular />}
              >
                {t('system.message.save')}
              </Button>
            )}
          </ButtonPanel>
        </div>
      </div>

      <NameMultiLangDrawer
        initialData={getValues().shortName}
        isOpen={isShortNameDrawerOpen}
        isReadOnly={readOnly}
        onDrawerClose={() => toggleDrawer('shortName')}
        onValueChange={(ev, data) =>
          handleNameFieldChange('shortName', ev, data)
        }
        title={t('currencyMaintenance.shortName')}
        t={t}
      />

      <NameMultiLangDrawer
        initialData={getValues().name}
        isOpen={isNameDrawerOpen}
        isReadOnly={readOnly}
        onDrawerClose={() => toggleDrawer('name')}
        onValueChange={(ev, data) => handleNameFieldChange('name', ev, data)}
        title={t('currencyMaintenance.name')}
        t={t}
      />
    </div>
  );
};
