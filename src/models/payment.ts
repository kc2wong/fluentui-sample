import { Amount, OptionalAmount } from './amount';

type Memo = {
  createDatetime: Date;
  message: string;
};

export enum PaymentStatus {
  New = 'new',
  Started = 'started',
  Submitted = 'submitted',
  Cancelled = 'cancelled',
  Paired = 'paired',
  Rejected = 'rejected',
}

export enum PaymentDirection {
  Incoming = 'incoming',
  Outgoing = 'outgoing',
}

// Define two mutually exclusive interface shapes
interface CreditAmountInterface {
  creditAmount: Amount;
  debitAmount: OptionalAmount;
}

interface DebitAmountInterface {
  creditAmount: OptionalAmount;
  debitAmount: Amount;
}

// Combine the two shapes into a single interface
type AmountInterfaceType = CreditAmountInterface | DebitAmountInterface;

type PaymentBase = Omit<
  AmountInterfaceType & {
    site: string;
    account: string;
    direction: PaymentDirection;
    executeDate?: Date;
    instructionId?: string;
    fxRef?: string;
    status: PaymentStatus;
    product?: string;
    valueDate?: Date;
    pairedAmount?: number;
    pairedFxRef?: string;
  },
  ''
>;

interface Payment extends Omit<PaymentBase, 'executeDate' | 'instructionId'> {
  instructionId: string;
  executeDate: Date;
  memo: Memo[];
}

export type { PaymentBase, Payment, Memo };
