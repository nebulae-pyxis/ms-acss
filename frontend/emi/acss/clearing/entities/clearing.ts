export class Clearing {
  timestamp: number;
  lastUpdateTimestamp: number;
  businessId: string;
  input: any;
  output: any;
  cumulatedTransactions: number[];
  partialSettlement: any;
  open: boolean;
}
