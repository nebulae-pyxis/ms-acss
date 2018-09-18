import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { GatewayService } from "../../../../api/gateway.service";
import { getAccumulatedTransactionsByIds, getTransactionsByIds } from "../gql/acss";

@Injectable()
export class ClearingService {
  constructor(private gateway: GatewayService) {}

  /**
   * Gets the accumulated transactions
   * @param page page number of the query
   * @param count Max amount of rows to be return
   * @param ids Ids of the accumulated transactions
   */
  getAccumulatedTransactionsByIds$(page, count, ids) {
    return this.gateway.apollo.query<any>({
      query: getAccumulatedTransactionsByIds,
      variables: {
        page: page,
        count: count,
        ids: ids
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

  /**
   * Gets transactions by its ids
   * @param page page number of the query
   * @param count Max amount of rows to be return
   * @param filterType Filter by transaction type
   * @param ids Ids of the accumulated transactions
   */
  getTransactionsByIds$(page, count, filterType, ids) {
    return this.gateway.apollo.query<any>({
      query: getTransactionsByIds,
      variables: {
        page: page,
        count: count,
        filterType: filterType,
        ids: ids
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }
}
