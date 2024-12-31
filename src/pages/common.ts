import { makeStyles, shorthands, tokens, typographyStyles } from '@fluentui/react-components';
import pathMappingJson from './pathMapping.json';

export const useStyles = makeStyles({
  root: {
    ...shorthands.overflow('hidden'),
    display: 'flex',
    height: '100vh',
    ...shorthands.flex(1),
    margin: '20px 0 0 20px',
  },

  content: {
    ...shorthands.flex(1),
    margin: '20px 0 0 20px',
  },

  titleBar: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    // margin: '0 0 0 20px',
    minHeight: '40px',
    gap: tokens.spacingVerticalS,
    '& span': typographyStyles.title3,
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    margin: '0 20px 0 0',
    width: '100%',
    maxWidth: '500px',
  },
  buttonPanel: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
});

const idToPathRecord = Object.entries(pathMappingJson).reduce(
  (obj, [key, value]) => {
    obj[key] = value;
    return obj;
  },
  {} as Record<string, string>,
);

const pathToIdRecord = Object.entries(pathMappingJson).reduce(
  (obj, [key, value]) => {
    obj[value] = key;
    return obj;
  },
  {} as Record<string, string>,
);

export const getMenuItemIdByPath = (path: string): string | undefined => {
  return pathToIdRecord[path];
};

export const getMenuItemPathById = (id: string): string | undefined => {
  return idToPathRecord[id];
};
