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
import { DialogContext } from '../contexts/Dialog';
import { MessageContext } from '../contexts/Message';

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
  const dialogCtx = useContext(DialogContext);
  const messageCtx = useContext(MessageContext);

  const { user } = login;

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
              dialogCtx.showConfirmationDialog({
                confirmType: 'signOut',
                message: t('userProfile.doYouWantToSignOut'),
                primaryButton: {
                  label: t('userProfile.signOut'),
                  icon: <CheckmarkRegular />,
                  action: () => {
                    messageCtx.showSpinner();
                    setTimeout(() => {
                      messageCtx.stopSpinner();
                      action({ signOut: {} });
                      navigate('/');
                    }, 500);
                  },
                },
                secondaryButton: {
                  label: t('system.message.cancel'),
                  icon: <DismissRegular />,
                },
              });
            }}
          >
            {t('userProfile.signOut')}
          </Button>
        </div>
      </PopoverSurface>
    </Popover>
  );
};
