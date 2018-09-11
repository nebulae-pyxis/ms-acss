import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { GatewayService } from '../../../../api/gateway.service';
import {
  getHelloWorld,
  ACSSHelloWorldSubscription
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
   * Hello World sample, please remove
   */
  getHelloWorld$() {
    return this.gateway.apollo
      .watchQuery<any>({
        query: getHelloWorld,
        fetchPolicy: 'network-only'
      })
      .valueChanges.map(
        resp => resp.data.getHelloWorldFromACSS.sn
      );
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
