import {
  Caption1,
  FieldProps as FlientUiFieldProps,
  Field as FluentUiField,
  Label,
  makeStyles,
  Text,
  tokens,
} from '@fluentui/react-components';
import { ErrorCircleFilled } from '@fluentui/react-icons';
import { CSSProperties } from 'react';

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
  infoMessageSlot: {
    height: '15px',
  },
  errorIcon: {
    marginRight: '4px',
  },
  hint: {
    marginBottom: '15px',
    textAlign: 'right',
  },
});

type FieldProps = FlientUiFieldProps & {
  horizontal?: boolean;
  infoMessage?: string;
  label: string;
  style?: CSSProperties;
  validationMessage?: string;
};

export const Field: React.FC<FieldProps> = ({
  children,
  horizontal,
  label,
  validationMessage,
  infoMessage,
  style,
  ...others
}: FieldProps) => {
  const styles = useStyles();
  if (horizontal ?? false) {
    const hint = infoMessage ? (
      <Caption1 align="end" italic>
        {infoMessage}
      </Caption1>
    ) : undefined;
    return (
      <FluentUiField
        hint={hint}
        label={label}
        orientation="horizontal"
        validationMessage={validationMessage}
        className={styles.hint}
        style={style}
        {...others}
      >
        {children}
      </FluentUiField>
    );
  } else {
    return (
      <div className={styles.column} style={style}>
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
        {/* Third Row: info message */}
        {infoMessage ? (
          <Caption1 align="end" italic>
            {infoMessage}
          </Caption1>
        ) : (
          <div className={styles.infoMessageSlot} />
        )}
      </div>
    );
  }
};
