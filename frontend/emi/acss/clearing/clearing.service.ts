import { Injectable } from "@angular/core";
import { Observable } from "rxjs/Observable";
import { GatewayService } from "../../../../api/gateway.service";
import { getAccumulatedTransactionsByIds, getAccumulatedTransactionsByClearingId, getTransactionsByAccumulatedTransactionId, getSettlementsByClearingId, getSettlementsCountByClearingId } from "../gql/acss";

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
   * Gets the accumulated transactions by clearingId
   * @param page page number of the query
   * @param count Max amount of rows to be return
   * @param clearingId Clearing ID
   */
  getAccumulatedTransactionsByClearingId$(page, count, clearingId) {
    return this.gateway.apollo.query<any>({
      query: getAccumulatedTransactionsByClearingId,
      variables: {
        page: page,
        count: count,
        clearingId
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

  /**
   * Gets transactions by accumulated transaction id
   * @param page page number of the query
   * @param count Max amount of rows to be return
   * @param filterType Filter by transaction type (AFCC_RELOAD, ...)
   * @param accumulatedTransactionId Id of the accumulated transaction
   */
  getTransactionsByAccumulatedTransactionId$(page, count, filterType, accumulatedTransactionId) {
    return this.gateway.apollo.query<any>({
      query: getTransactionsByAccumulatedTransactionId,
      variables: {
        page: page,
        count: count,
        filterType: filterType,
        accumulatedTransactionId: accumulatedTransactionId
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

  // /**
  //  * Gets transactions by its ids
  //  * @param page page number of the query
  //  * @param count Max amount of rows to be return
  //  * @param filterType Filter by transaction type
  //  * @param ids Ids of the accumulated transactions
  //  */
  // getTransactionsByIds$(page, count, filterType, ids) {
  //   return this.gateway.apollo.query<any>({
  //     query: getTransactionsByIds,
  //     variables: {
  //       page: page,
  //       count: count,
  //       filterType: filterType,
  //       ids: ids
  //     },
  //     fetchPolicy: "network-only",
  //     errorPolicy: "all"
  //   });
  // }


  /**
   * Gets settlements associated with the specified clearing Id
   * @param page page number of the query
   * @param count Max amount of rows to be return
   * @param clearingId Clearing ID
   */
  getSettlementsByClearingId$(page, count, clearingId) {
    return this.gateway.apollo.query<any>({
      query: getSettlementsByClearingId,
      variables: {
        page: page,
        count: count,
        clearingId: clearingId
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

  /**
   * Gets the amount of settlements associated with the specified clearing Id
   * @param id Clearing ID
   */
  getSettlementsCountByClearingId$(clearingId) {
    return this.gateway.apollo.query<any>({
      query: getSettlementsCountByClearingId,
      variables: {
        clearingId: clearingId
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }
}
