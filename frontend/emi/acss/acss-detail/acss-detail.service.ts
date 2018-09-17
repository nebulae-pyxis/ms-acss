import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { GatewayService } from '../../../../api/gateway.service';
import {
  getClearingById
} from '../gql/acss';
import {
  getACSSBusiness,
  getACSSBusinesses
} from '../gql/Business';

@Injectable()
export class ACSSDetailService {


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
        fetchPolicy: 'network-only',
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

}
