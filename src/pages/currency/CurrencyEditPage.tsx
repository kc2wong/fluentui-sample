import React from 'react';
import { useEffect, useState } from 'react';
import {
  Button,
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
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { TFunction } from 'i18next';
import { currencyAtom, OperationType } from '../../states/currency';
import { useAtom } from 'jotai';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { emptyStringToUndefined, undefinedToEmptyString } from '../../utils/object-util';
import { constructMessage } from '../../utils/string-util';
import { Language, MessageType } from '../../models/system';
import { Field } from '../../components/Field';
import { DetailEditingDrawer } from '../../components/Drawer';
import { useAppendBreadcrumb } from '../../contexts/PageElementNavigation';
import { useDialog } from '../../contexts/Dialog';
import { Form, Root } from '../../components/Container';
import { useFormDirty } from '../../contexts/FormDirty';
import { EmptyCell } from '../../components/EmptyCell';
import { Input } from '../../components/Input';
import { useNotification } from '../../states/base-state';
import { useMessage } from '../../contexts/Message';

// form in drawer for editing multi language name or shortname
const nameMultiLangSchema = z.object(
  Object.values(Language).reduce(
    (acc, lang) => {
      acc[lang] = z.preprocess((val) => emptyStringToUndefined(val), z.string().default(''));
      return acc;
    },
    {} as Record<string, z.ZodEffects<z.ZodDefault<z.ZodString>, string, unknown>>,
  ),
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
  useForm<NameMultiLangFormData>({
    defaultValues: initialData,
    resolver: zodResolver(nameMultiLangSchema),
  });
  return (
    <DetailEditingDrawer isOpen={isOpen} onCloseDrawer={onDrawerClose} t={t} title={title}>
      <Form numColumn={1}>
        {Object.values(Language).map((lang) => (
          <Field
            key={lang}
            label={t(`system.language.value.${lang}`)}
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
      </Form>
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
  code: z.preprocess((val) => emptyStringToUndefined(val), z.string().max(maxCodeLength)),
  name: z
    .record(
      z.preprocess((val) => emptyStringToUndefined(val), z.string().max(maxNameLength).optional()),
    )
    .refine((data) => data[Language.English] && data[Language.English].trim().length > 0, {
      message: 'Required',
      path: ['en'], // path of error
    }),
  shortName: z
    .record(
      z.preprocess(
        (val) => emptyStringToUndefined(val),
        z.string().max(maxShortNameLength).optional(),
      ),
    )
    .refine((data) => data[Language.English] && data[Language.English].trim().length > 0, {
      message: 'Required',
      path: ['en'], // path of error
    }),
  precision: z.number().min(minPrecision).max(maxPrecision).default(minPrecision),
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

// button to toggle multi lang drawer
type NameMultiLangButtonProps = {
  isOpen: boolean;
  onClick: () => void;
};
const NameMultiLangButton: React.FC<NameMultiLangButtonProps> = (
  props: NameMultiLangButtonProps,
) => {
  return (
    <Button
      {...props}
      appearance="transparent"
      icon={props.isOpen ? <ArrowCircleLeftRegular /> : <TranslateAutoRegular />}
      onClick={props.onClick}
      size="medium"
    />
  );
};

type CurrencyEditPageProps = {
  readOnly: boolean;
  onBackButtonClick: () => void;
};

export const CurrencyEditPage: React.FC<CurrencyEditPageProps> = ({
  onBackButtonClick,
  readOnly,
}: CurrencyEditPageProps) => {
  const [isDrawerOpen, setIsDrawerOpen] = useState([false, false]); // shortName, name
  const { t } = useTranslation();
  const { dispatchMessage } = useMessage();

  const [currencyState, action] = useAtom(currencyAtom);
  const initialData = currencyState.activeRecord;

  const { showConfirmationDialog } = useDialog();
  const { markDirty, resetDirty } = useFormDirty();

  useNotification(currencyState, {
    operationStart: () => {},
    operationComplete: (type, result) => {
      if (type === OperationType.Save && result.operationFailureReason?.type !== MessageType.Error) {
        dispatchMessage({
          type: MessageType.Success,
          text: constructMessage(t, 'system.message.saveObjectSuccess', [
            'Currency',
            formValues.code,
          ]),
        });
        reset();
        resetDirty();
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
    formState: { errors, isDirty },
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
    // to trigger enable / disable of save button and mark dirtiness
    if (isDirty) {
      markDirty();
    }
    return () => resetDirty();
  }, [formValues, isDirty, markDirty, resetDirty]);

  const mode = currencyState.activeRecord
    ? readOnly
      ? 'system.message.view'
      : 'system.message.edit'
    : 'system.message.add';
  useAppendBreadcrumb('currencyMaintenance.titleEdit', mode, onBackButtonClick);

  const handleNameFieldChange = (
    fieldName: 'name' | 'shortName',
    langStr: string,
    value: string,
  ) => {
    const currentFieldValues = getValues()[fieldName];

    currentFieldValues[
      langStr === Language.TraditionalChinese ? Language.TraditionalChinese : Language.English
    ] = value;

    setValue(fieldName, currentFieldValues, { shouldDirty: true });
  };

  const handlePrecisionChange = (e: SpinButtonChangeEvent, data: SpinButtonOnChangeData) => {
    if (data.value) {
      setValue('precision', data.value, { shouldDirty: true });
    } else if ('value' in e.target) {
      // value entered directly
      setValue('precision', parseInt(e.target.value), { shouldDirty: true });
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

  const backButton = (
    <Button icon={<ArrowTurnUpLeftRegular />} onClick={onBackButtonClick}>
      {t('system.message.back')}
    </Button>
  );
  const saveButton = (
    <Button
      appearance="primary"
      disabled={missingRequiredField(getValues())}
      icon={<SaveRegular />}
      onClick={handleSubmit(() => {
        showConfirmationDialog({
          confirmType: 'save',
          message: t('system.message.doYouWantToSaveChange'),
          primaryButton: {
            label: t('system.message.save'),
            icon: <CheckmarkRegular />,
            action: () => {
              action({
                save: {
                  currency: { ...initialData, ...getValues() },
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
    >
      {t('system.message.save')}
    </Button>
  );

  return (
    <Root>
      <Form
        buttons={readOnly ? [backButton] : [backButton, saveButton]}
        numColumn={3}
        styles={{ width: '510px', maxWidth: '50vw' }}
        title={constructMessage(t, 'currencyMaintenance.titleEdit', [
          currencyState.activeRecord
            ? readOnly
              ? t('system.message.view')
              : t('system.message.edit')
            : t('system.message.add'),
        ])}
      >
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <Field
              label={t('currencyMaintenance.code')}
              required
              validationMessage={errors?.code?.message}
            >
              <Input
                {...field}
                maxLength={maxCodeLength}
                readOnly={readOnly || currencyState.activeRecord !== undefined}
              />
            </Field>
          )}
        />
        <EmptyCell colSpan={2} />

        <Controller
          control={control}
          name="shortName"
          render={({ field }) => {
            return (
              <Field
                colSpan={3}
                label={t('currencyMaintenance.shortName')}
                required
                validationMessage={errors?.shortName?.en?.message}
              >
                <Input
                  contentAfter={
                    <NameMultiLangButton
                      isOpen={isShortNameDrawerOpen}
                      onClick={() => toggleDrawer('shortName')}
                    />
                  }
                  disabled={readOnly ? false : isShortNameDrawerOpen}
                  name={field.name}
                  onChange={(evt, data) => {
                    handleNameFieldChange(field.name, evt.target.name, data.value);
                  }}
                  readOnly={readOnly}
                  value={field.value[Language.English]}
                />
              </Field>
            );
          }}
        />

        <Controller
          control={control}
          name="name"
          render={({ field }) => {
            return (
              <Field
                colSpan={3}
                label={t('currencyMaintenance.name')}
                required
                validationMessage={errors?.name?.en?.message}
              >
                <Input
                  contentAfter={
                    <NameMultiLangButton
                      isOpen={isNameDrawerOpen}
                      onClick={() => toggleDrawer('name')}
                    />
                  }
                  disabled={readOnly ? false : isShortNameDrawerOpen}
                  name={field.name}
                  onChange={(evt, data) => {
                    handleNameFieldChange(field.name, evt.target.name, data.value);
                  }}
                  readOnly={readOnly}
                  value={field.value[Language.English]}
                />
              </Field>
            );
          }}
        />

        <Controller
          control={control}
          name="precision"
          render={({ field }) => {
            const { value, ...others } = field;
            return (
              <Field
                label={t('currencyMaintenance.precision')}
                required
                validationMessage={errors?.precision?.message}
              >
                {readOnly ? (
                  <Input {...others} readOnly={true} value={value.toString()} />
                ) : (
                  <SpinButton
                    {...field}
                    max={maxPrecision}
                    min={minPrecision}
                    onChange={handlePrecisionChange}
                  />
                )}
              </Field>
            );
          }}
        />
        <EmptyCell colSpan={2} />
      </Form>
      <div style={{ flex: 1 }}></div>

      <NameMultiLangDrawer
        initialData={getValues().shortName}
        isOpen={isShortNameDrawerOpen}
        isReadOnly={readOnly}
        onDrawerClose={() => toggleDrawer('shortName')}
        onValueChange={(ev, data) => handleNameFieldChange('shortName', ev, data)}
        t={t}
        title={t('currencyMaintenance.shortName')}
      />

      <NameMultiLangDrawer
        initialData={getValues().name}
        isOpen={isNameDrawerOpen}
        isReadOnly={readOnly}
        onDrawerClose={() => toggleDrawer('name')}
        onValueChange={(ev, data) => handleNameFieldChange('name', ev, data)}
        t={t}
        title={t('currencyMaintenance.name')}
      />
    </Root>
  );
};
