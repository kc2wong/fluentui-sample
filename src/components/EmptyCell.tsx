import { CSSProperties } from 'react';

type EmptyCellProps = {
  colSpan?: number;
};
export const EmptyCell: React.FC<EmptyCellProps> = ({ colSpan }) => {
  const mergedStyle: CSSProperties = {
    ...(colSpan ? { gridColumn: `span ${colSpan}` } : {}),
  };

  return <div style={mergedStyle}></div>;
};
