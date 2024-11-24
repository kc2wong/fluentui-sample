import {
  makeStyles,
  Body1,
  Button,
  Input,
  tokens,
} from '@fluentui/react-components';
import { PersonPasskeyRegular } from '@fluentui/react-icons';
import { Card, CardHeader, CardPreview } from '@fluentui/react-components';
import { ButtonPanel } from '../components/ButtonPanel';
import { authentication } from '../states/authentication';
import { useAtom } from 'jotai';
import { useContext, useEffect } from 'react';
import { MessageContext } from '../contexts/Message';
import { useTranslation } from 'react-i18next';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Field } from '../components/Field';
import { emptyStringToUndefined } from '../utils/objectUtil';
import { useNotification } from '../states/baseState';
import { constructErrorMessage, constructMessage } from '../utils/stringUtil';
import { MessageType } from '../models/system';
import { entitledSiteAtom } from '../states/entitledSite';
import { useResetAtom } from 'jotai/utils';
import { currencyAtom } from '../states/currency';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'center', // Centers horizontally
    alignItems: 'center', // Centers vertically
    height: '100vh', // Full height of the viewport
  },
  card: {
    width: '30%',
  },
  box: {
    backgroundColor: tokens.colorNeutralBackground2,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    margin: '0 20px 0 20px',
    padding: '10px 0 0 0',
  },
  buttonPanel: {
    margin: '40px 20px 20px 0',
  },
});

const schema = z.object({
  email: z.preprocess(
    (val) => emptyStringToUndefined(val),
    z.string().email('Invalid email address')
  ),
  password: z.preprocess((val) => emptyStringToUndefined(val), z.string()),
});

type FormData = z.infer<typeof schema>;

export const LoginPage = () => {
  const styles = useStyles();
  const messageCtx = useContext(MessageContext);

  const { t } = useTranslation();

  const [state, action] = useAtom(authentication);
  const resetSharedData = useResetAtom(entitledSiteAtom);
  const resetCurrencyMaintenance = useResetAtom(currencyAtom);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  useNotification(state, {
    showSpinner: messageCtx.showSpinner,
    stopSpinner: messageCtx.stopSpinner,
    showOperationResultMessage: (message) => {
      if (message.type === MessageType.Error) {
        messageCtx.dispatchMessage({
          type: message.type,
          text: constructErrorMessage(t, message.key, message.parameters),
        });
      } else {
        messageCtx.dispatchMessage({
          type: message.type,
          text: constructMessage(t, message.key, message.parameters),
        });
      }
    },
    additionAction: (state) => {
      if (state.login !== undefined) {
        // display main page 1 second after login success
        setTimeout(() => {
          action({ acknowledgeSignIn: {} });
        }, 1000);
      }
    },
  });

  useEffect(() => {
    if (state.login === undefined) {
      resetSharedData();
      resetCurrencyMaintenance();
    }
  }, [state.login, resetSharedData, resetCurrencyMaintenance]);

  const handleLogin = async (data: FormData) => {
    action({
      signIn: {
        id: data.email,
        password: data.password,
      },
    });
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <CardHeader
          header={
            <Body1>
              {t('login.greeting')} <b>{process.env.REACT_APP_NAME}</b>
            </Body1>
          }
        />
        <CardPreview className={styles.box}>
          <div>
            <div className={styles.form}>
              <Field
                label={t('login.email')}
                required
                validationMessage={errors.email?.message}
              >
                <Input type="email" {...register('email')} />
              </Field>
              <Field
                label={t('login.password')}
                required
                validationMessage={errors.password?.message}
              >
                <Input type="password" {...register('password')} />
              </Field>
            </div>
            <ButtonPanel className={styles.buttonPanel}>
              <Button
                appearance="primary"
                icon={<PersonPasskeyRegular />}
                onClick={handleSubmit(handleLogin)}
              >
                {t('login.signIn')}
              </Button>
            </ButtonPanel>
          </div>
        </CardPreview>
      </Card>
    </div>
  );
};