import { configureEnv } from '@louriest/envisor';

const NODE_ENV = process.env.NODE_ENV || 'dev';

export const config = configureEnv(
  { DB_URI: 'string', PORT: 'number', HOST: 'string', TOKEN: 'string' },
  { path: NODE_ENV === 'prod' ? '.env' : '.env.dev' },
);
