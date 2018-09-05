import { msnamecamelService } from './msname.service';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { fuseAnimations } from '../../../core/animations';
import { Subscription } from 'rxjs/Subscription';
import * as Rx from 'rxjs/Rx';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'msname',
  templateUrl: './msname.component.html',
  styleUrls: ['./msname.component.scss'],
  animations: fuseAnimations
})
export class msnamecamelComponent implements OnInit, OnDestroy {
  
  helloWorld: String = 'Hello World static';
  helloWorldLabelQuery$: Rx.Observable<any>;
  helloWorldLabelSubscription$: Rx.Observable<any>;

  constructor(private msnamecamelervice: msnamecamelService  ) {    

  }
    

  ngOnInit() {
    this.helloWorldLabelQuery$ = this.msnamecamelervice.getHelloWorld$();
    this.helloWorldLabelSubscription$ = this.msnamecamelervice.getEventSourcingMonitorHelloWorldSubscription$();
  }

  
  ngOnDestroy() {
  }

}
