import {
  FieldProps as FlientUiFieldProps,
  Label,
  makeStyles,
  Text,
  tokens,
} from '@fluentui/react-components';
import { ErrorCircleFilled } from '@fluentui/react-icons';

const useStyles = makeStyles({
  column: { display: 'flex', flexDirection: 'column', gap: '2px' },
  row: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorMessageCell: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-end',
    color: tokens.colorStatusDangerForeground1,
  },
  errorIcon: {
    marginRight: '4px',
  },
});

type FieldProps = FlientUiFieldProps & {
  validationMessage?: string;
  label: string;
};

export const Field: React.FC<FieldProps> = ({
  children,
  label,
  validationMessage,
  ...others
}: FieldProps) => {
  const styles = useStyles();
  return (
    <div className={styles.column}>
      <div className={styles.row}>
        {/* First Row: Label and Error Message */}
        <Label required={others.required}>{label}</Label>
        {validationMessage && (
          <div className={styles.errorMessageCell}>
            <ErrorCircleFilled className={styles.errorIcon} />
            <Text size={200}>{validationMessage}</Text>
          </div>
        )}
      </div>
      {/* Second Row: child */}
      <>{children}</>
    </div>
  );
};
