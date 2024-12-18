type Amount = {
  ccy: string;
  value: number;
};

type OptionalAmount = {
  ccy: string;
  value?: number;
};

export type { Amount, OptionalAmount };
