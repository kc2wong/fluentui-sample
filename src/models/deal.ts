import { Amount } from './amount';

interface Deal {
  site: string;
  fxRef: string;
  dealAmount: Amount;
  contraAmount: Amount;
}

export type { Deal };
