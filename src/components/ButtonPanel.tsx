import { Button, makeStyles } from '@fluentui/react-components';
import React, { ReactElement } from 'react';

const useStyles = makeStyles({
  container: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '10px',
  },
});

interface ButtonPanelProps {
  className?: string;
  children: ReactElement<typeof Button> | ReactElement<typeof Button>[];
}

export const ButtonPanel: React.FC<ButtonPanelProps> = ({ className, children }) => {
  const styles = useStyles();

  return (
    <div className={`${className} ${styles.container}`}>
      {Array.isArray(children)
        ? children.map((child, index) => <React.Fragment key={index}>{child}</React.Fragment>)
        : children}
    </div>
  );
};
