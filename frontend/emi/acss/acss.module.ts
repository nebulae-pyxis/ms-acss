import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../core/modules/shared.module';
import { DatePipe } from '@angular/common';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';

import { ACSSService } from './acss.service';
import { ACSSComponent } from './acss.component';
import { ClearingComponent } from './clearing/clearing.component';
import { SettlementComponent } from './settlement/settlement.component';
import { ACSSDetailComponent } from './acss-detail/acss-detail.component';
import { ACSSDetailService } from './acss-detail/acss-detail.service';
import { ClearingService } from './clearing/clearing.service';
import { TransactionsComponent } from './transactions/transactions.component';

const routes: Routes = [
  {
    path: '',
    component: ACSSComponent,
  },
  {
    path: 'acss-detail/:id',
    component: ACSSDetailComponent,
  }
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FuseWidgetModule
  ],
  declarations: [
    ACSSComponent,
    ACSSDetailComponent,
    ClearingComponent,
    SettlementComponent,
    TransactionsComponent
  ],
  providers: [ ACSSService, ACSSDetailService, ClearingService, DatePipe]
})

export class ACSSModule {}
