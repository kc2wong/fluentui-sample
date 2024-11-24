import { ModelBase } from './system';

interface CurrencyBase {
  code: string;
  name: Record<string, string | undefined>;
  precision: number;
  shortName: Record<string, string | undefined>;
}

interface Currency extends ModelBase, CurrencyBase {}

export type { CurrencyBase, Currency };
