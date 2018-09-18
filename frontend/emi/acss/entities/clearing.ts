export class Clearing {
  _id: string;
  timestamp: Date;
  lastUpdateTimestamp: number;
  businessId: string;
  businessName: string;
  input: any;
  output: any;
  accumulatedTransactionIds: number[];
  partialSettlement: any;
  open: boolean;

}
