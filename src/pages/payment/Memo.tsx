import {
  tokens,
  Divider,
  Textarea,
  Button,
  makeStyles,
  shorthands,
  Caption1,
  Body1,
} from '@fluentui/react-components';
import { AddRegular } from '@fluentui/react-icons';

import { Memo as M } from '../../models/payment';

import { useState } from 'react';
import { formatDateDDMMYYYYHHMISS } from '../../utils/dateUtil';
import { useTranslation } from 'react-i18next';

const useStyles = makeStyles({
  container: {
    width: '30vw',
    minWidth: '400px',
    marginLeft: 'auto',
    marginRight: tokens.spacingHorizontalXXL,
    display: 'flex',
    flexDirection: 'column',
    gap: tokens.spacingVerticalS,
  },
  readContent: {
    ...shorthands.borderStyle('solid'),
    ...shorthands.borderColor(tokens.colorNeutralStroke2),
    height: '60vh',
    display: 'flex',
    flexDirection: 'column',
    '& div': {
      marginLeft: tokens.spacingHorizontalS,
      marginTop: tokens.spacingVerticalS,
      marginBottom: tokens.spacingVerticalXXS,
    },
  },
  inputContent: {
    width: '100%',
    height: '15vh',
  },
  button: {
    alignSelf: 'flex-end',
    width: 'auto',
  },
});

type MemoProps = {
  historyMemo?: M[];
  onAddMemo?: (memo: string) => void;
  readOnly: boolean;
};
export const Memo: React.FC<MemoProps> = ({
  historyMemo,
  onAddMemo,
  readOnly,
}) => {
  const styles = useStyles();
  const { t } = useTranslation();
  const [newMemo, setNewMemo] = useState<string>('');

  return (
    <div className={styles.container}>
      <Divider>{t('paymentMaintenance.memo')}</Divider>
      <div className={styles.readContent}>
        {(historyMemo ?? []).map((m, index) => (
          <div key={index} style={{ marginBottom: tokens.spacingVerticalS }}>
            <Caption1 italic>
              {formatDateDDMMYYYYHHMISS(m.createDatetime)}
            </Caption1>
            <br />
            <Body1>{m.message}</Body1>
          </div>
        ))}
      </div>
      {readOnly || !onAddMemo ? (
        <></>
      ) : (
        <>
          <Textarea
            className={styles.inputContent}
            onChange={(_ev, data) => setNewMemo(data.value)}
            placeholder={t('system.message.typeHere')}
          ></Textarea>
          <Button
            className={styles.button}
            disabled={newMemo.length === 0}
            onClick={() => onAddMemo(newMemo)}
            icon={<AddRegular />}
          >
            {t('system.message.add')}
          </Button>
        </>
      )}
    </div>
  );
};
