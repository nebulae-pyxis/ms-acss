export class Clearing {
  timestamp: Date;
  lastUpdateTimestamp: number;
  businessId: string;
  input: any;
  output: any;
  cumulatedTransactions: number[];
  partialSettlement: any;
  open: boolean;
}
