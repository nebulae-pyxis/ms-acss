import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { GatewayService } from '../../../api/gateway.service';
import {
  getClearingById,
  getAllClearingsFromBusiness,
  getSettlementsByBusinessId,
  getSettlementsCountByBusinessId,
  getAccumulatedTransactionErrors,
  getAccumulatedTransactionErrorsCount,
  getClearingErrors,
  getClearingErrorsCount,
  getSettlementErrors,
  getSettlementErrorsCount,
  changeSettlementState
} from './gql/acss';
import {
  getACSSBusiness,
  getBusinessById,
  getACSSBusinesses
} from './gql/Business';

@Injectable()
export class ACSSService {

  private selectedBusinessSubject = new BehaviorSubject(null);

  constructor(private gateway: GatewayService) {
  }

  /**
   * Returns an observable
   */
  get selectedBusinessEvent$(){
    return this.selectedBusinessSubject.asObservable();
  }

  /**
   * Set the selected business
   */
  selectedBusiness(business){
    this.selectedBusinessSubject.next(business);
  }

  /**
   * get the business which the user belongs
   *
   * @returns {Observable}
   */
  getACSSBusiness$() {
    return this.gateway.apollo
      .query<any>({
        query: getACSSBusiness,
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      });
  }

  /**
   * get the business by id
   *
   * @returns {Observable}
   */
  getBusinessById$(id) {
    return this.gateway.apollo
      .query<any>({
        query: getBusinessById,
        variables: {
          id: id
        },
        fetchPolicy: 'network-only',
        errorPolicy: 'all'
      });
  }


  /**
   * get all of the businesses
   *
   * @returns {Observable}
   */
  getACSSBusinesses$() {
    return this.gateway.apollo
      .query<any>({
        query: getACSSBusinesses,
        fetchPolicy: "network-only",
        errorPolicy: 'all'
      });
  }


/**
 * Gets the clearings associated with a business
 * @param page page number of the clearing
 * @param count Max amount of rows to be return
 * @param businessId Business id filter
 */
  getClearingsFromBusiness$(page, count, businessId) {
    return this.gateway.apollo
      .query<any>({
        query: getAllClearingsFromBusiness,
        variables: {
          page: page,
          count: count,
          businessId: businessId
        },
        fetchPolicy: "network-only",
        errorPolicy: 'all'
      });
  }

/**
 * Gets the clearing by its id
 * @param clearingId Clearing id filter
 */
getClearingById$(clearingId) {
  return this.gateway.apollo
    .query<any>({
      query: getClearingById,
      variables: {
        id: clearingId
      },
      fetchPolicy: "network-only",
      errorPolicy: 'all'
    });
}

  /**
   * Gets settlements associated with the specified business Id
   * @param page page number of the query
   * @param count Max amount of rows to be return
   * @param businessId business ID
   */
  getSettlementsByBusinessId$(page, count, businessId) {
    return this.gateway.apollo.query<any>({
      query: getSettlementsByBusinessId,
      variables: {
        page: page,
        count: count,
        businessId: businessId
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

  /**
   * Gets the amount of settlements associated with the specified business Id
   * @param page page
   * @param count count
   * @param id Business ID
   */
  getSettlementsCountByBusinessId$(page, count, businessId) {
    return this.gateway.apollo.query<any>({
      query: getSettlementsCountByBusinessId,
      variables: {
        page: page,
        count: count,
        businessId: businessId
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

  /**
   * Gets accumulated tx errors
   * @param page page
   * @param count count
   */
  getAccumulatedTransactionErrors$(page, count) {
    return this.gateway.apollo.query<any>({
      query: getAccumulatedTransactionErrors,
      variables: {
        page: page,
        count: count
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

    /**
   * Gets accumulated tx errors count
   */
  getAccumulatedTransactionErrorsCount$() {
    return this.gateway.apollo.query<any>({
      query: getAccumulatedTransactionErrorsCount,
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

    /**
   * Gets clearing errors
   * @param page page
   * @param count count
   */
  getClearingErrors$(page, count) {
    return this.gateway.apollo.query<any>({
      query: getClearingErrors,
      variables: {
        page: page,
        count: count
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

    /**
   * Gets clearing errors count
   */
  getClearingErrorsCount$() {
    return this.gateway.apollo.query<any>({
      query: getClearingErrorsCount,
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

      /**
   * Gets settlement errors
   * @param page page
   * @param count count
   */
  getSettlementErrors$(page, count) {
    return this.gateway.apollo.query<any>({
      query: getSettlementErrors,
      variables: {
        page: page,
        count: count
      },
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

  /**
   * Gets clearing errors count
   */
  getSettlementErrorsCount$() {
    return this.gateway.apollo.query<any>({
      query: getSettlementErrorsCount,
      fetchPolicy: "network-only",
      errorPolicy: "all"
    });
  }

   /**
   * Change the state of a settlement
   * @param settlementId Settlement ID
   * @param settlementState New settlement state
   * @returns {Observable}
   */
  changeSettlementState$(settlementId, settlementState): Observable<any> {
    return this.gateway.apollo
      .mutate<any>({
        mutation: changeSettlementState,
        variables: {
          settlementId: settlementId,
          settlementState: settlementState
        },
        errorPolicy: 'all'
      });
  }


}
