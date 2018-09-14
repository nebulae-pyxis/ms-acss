import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { GatewayService } from '../../../api/gateway.service';
import {
  getClearingById,
  getAllClearingsFromBusiness,
  ACSSHelloWorldSubscription
} from './gql/acss';
import {
  getACSSBusiness,
  getACSSBusinesses
} from './gql/Business';

@Injectable()
export class ACSSService {


  constructor(private gateway: GatewayService) {

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
  * Hello World subscription sample, please remove
  */
 getEventSourcingMonitorHelloWorldSubscription$(): Observable<any> {
  return this.gateway.apollo
    .subscribe({
      query: ACSSHelloWorldSubscription
    })
    .map(resp => resp.data.EventSourcingMonitorHelloWorldSubscription.sn);
}

}
