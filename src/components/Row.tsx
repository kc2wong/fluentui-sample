import { makeStyles } from '@fluentui/react-components';
import { ReactElement } from 'react';

const useStyles = makeStyles({
  row: {
    display: 'flex',
    flexDirection: 'row',
    gap: '5px',
  },
});

type RowProps = {
  children: ReactElement | ReactElement[];
};

export const Row: React.FC<RowProps> = ({ children }: RowProps) => {
  const styles = useStyles();
  return <div className={styles.row}>{children}</div>;
};
