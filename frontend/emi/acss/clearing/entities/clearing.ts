export class Clearing {
  _id: string;
  timestamp: Date;
  lastUpdateTimestamp: number;
  businessId: string;
  businessName: string;
  input: any;
  output: any;
  cumulatedTransactions: number[];
  partialSettlement: any;
  open: boolean;
  
}
