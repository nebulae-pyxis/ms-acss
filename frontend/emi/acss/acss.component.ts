import { ACSSService } from './acss.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { fuseAnimations } from '../../../core/animations';
import { Subscription } from 'rxjs/Subscription';
import * as Rx from 'rxjs/Rx';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'acss',
  templateUrl: './acss.component.html',
  styleUrls: ['./acss.component.scss'],
  animations: fuseAnimations
})
export class ACSSComponent implements OnInit, OnDestroy {
  
  helloWorld: String = 'Hello World static';
  helloWorldLabelQuery$: Rx.Observable<any>;
  helloWorldLabelSubscription$: Rx.Observable<any>;

  constructor(private ACSService: ACSSService  ) {    

  }
    

  ngOnInit() {
    this.helloWorldLabelQuery$ = this.ACSService.getHelloWorld$();
    this.helloWorldLabelSubscription$ = this.ACSService.getEventSourcingMonitorHelloWorldSubscription$();
  }

  
  ngOnDestroy() {
  }

}
