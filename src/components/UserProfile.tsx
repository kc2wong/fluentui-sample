import React, { useContext } from 'react';
import {
  Popover,
  PopoverTrigger,
  makeStyles,
  PopoverSurface,
  Avatar,
  Button,
} from '@fluentui/react-components';
import {
  CheckmarkRegular,
  DismissRegular,
  DoorArrowLeftRegular,
} from '@fluentui/react-icons';
import { Login } from '../models/login';
import { authentication } from '../states/authentication';
import { useSetAtom } from 'jotai';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { DialogContext, useDialog } from '../contexts/Dialog';
import { MessageContext } from '../contexts/Message';
import { useFormDirty } from '../contexts/FormDirty';

const useStyles = makeStyles({
  profileContentHeader: {
    marginTop: '0',
  },
});

interface UserProfileProps {
  login: Login;
}

export const UserProfile: React.FC<UserProfileProps> = ({ login }) => {
  const styles = useStyles();
  const action = useSetAtom(authentication);
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { showConfirmationDialog } = useDialog();
  const { isDirty } = useFormDirty();
  const messageCtx = useContext(MessageContext);

  const { user } = login;

  const signOut = () => {
    messageCtx.showSpinner();
    setTimeout(() => {
      messageCtx.stopSpinner();
      action({ signOut: {} });
      navigate('/');
    }, 500);
  }

  return (
    <Popover withArrow>
      <PopoverTrigger disableButtonEnhancement>
        <Avatar name={user.name} />
      </PopoverTrigger>

      <PopoverSurface tabIndex={-1}>
        <div>
          <h3 className={styles.profileContentHeader}>{user.id}</h3>
          <p>
            {t('userProfile.name')}: {user.name}
          </p>
          <p>
            {t('userProfile.lastLogin')}:{' '}
            {new Date(login.user.lastLoginDatetime).toLocaleString()}
          </p>
          <Button
            icon={<DoorArrowLeftRegular />}
            onClick={() => {
              if (isDirty()) {
                showConfirmationDialog({
                  confirmType: t(`system.message.signOut`),
                  message: t('userProfile.doYouWantToSignOut'),
                  primaryButton: {
                    label: t('userProfile.signOut'),
                    icon: <CheckmarkRegular />,
                    action: signOut,
                    // action: () => {
                    //   messageCtx.showSpinner();
                    //   setTimeout(() => {
                    //     messageCtx.stopSpinner();
                    //     action({ signOut: {} });
                    //     navigate('/');
                    //   }, 500);
                    // },
                  },
                  secondaryButton: {
                    label: t('system.message.cancel'),
                    icon: <DismissRegular />,
                  },
                });  
              }
              else {
                signOut();
              }
            }}
          >
            {t('userProfile.signOut')}
          </Button>
        </div>
      </PopoverSurface>
    </Popover>
  );
};
