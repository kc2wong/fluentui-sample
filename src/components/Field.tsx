import {
  Caption1,
  FieldProps as FlientUiFieldProps,
  Field as FluentUiField,
  InfoLabel,
  Label,
  makeStyles,
  Text,
  tokens,
} from '@fluentui/react-components';
import { ErrorCircleFilled } from '@fluentui/react-icons';
import { cloneElement, CSSProperties, ReactElement, useId } from 'react';

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

export type FieldProps = Omit<FlientUiFieldProps, 'children'> & {
  children: ReactElement;
  horizontal?: boolean;
  infoMessage?: string;
  label: string;
  labelHint?: string;
  colSpan?: number;
  style?: CSSProperties;
  validationMessage?: string;
};

export const Field: React.FC<FieldProps> = ({
  children,
  horizontal,
  label,
  labelHint,
  colSpan,
  validationMessage,
  infoMessage,
  style,
  ...others
}: FieldProps) => {
  const mergedStyle: CSSProperties = {
    ...style,
    ...(colSpan ? { gridColumn: `span ${colSpan}` } : {}),
  };

  const styles = useStyles();
  if (horizontal ?? false) {
    const hint = infoMessage ? (
      <Caption1 align="end" italic>
        {infoMessage}
      </Caption1>
    ) : undefined;
    return (
      <FluentUiField
        className={styles.hint}
        hint={hint}
        label={label}
        orientation="horizontal"
        style={mergedStyle}
        validationMessage={validationMessage}
        {...others}
      >
        {children}
      </FluentUiField>
    );
  } else {
    // generate unique ID
    const id = children.props.id;
    const generatedId = id ?? useId();

    const labelComponent = labelHint ? (
      <InfoLabel
        htmlFor={generatedId}
        info={<>{labelHint} </>}
        infoButton={{ tabIndex: -1 }}
        required={others.required}
      >
        {label}
      </InfoLabel>
    ) : (
      <Label htmlFor={generatedId} required={others.required}>
        {label}
      </Label>
    );
    return (
      <div className={styles.column} style={mergedStyle}>
        <div className={styles.row}>
          {/* First Row: Label and Error Message */}
          {labelComponent}
          {validationMessage && (
            <div className={styles.errorMessageCell}>
              <ErrorCircleFilled className={styles.errorIcon} />
              <Text size={200}>{validationMessage}</Text>
            </div>
          )}
        </div>
        {/* Second Row: child */}
        <> {id ? children : cloneElement(children, { id: generatedId })}</>
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
