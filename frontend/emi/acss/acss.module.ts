import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../core/modules/shared.module';
import { DatePipe } from '@angular/common';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';

import { ACSSService } from './acss.service';
import { ACSSComponent } from './acss.component';
import { ClearingComponent } from './clearing/clearing.component';
import { SettlementComponent } from './settlement/settlement.component';
import { ClearingDetailComponent } from './clearing-detail/clearing-detail.component';
import { ClearingDetailService } from './clearing-detail/clearing-detail.service';
import { ClearingService } from './clearing/clearing.service';
import { TransactionsComponent } from './transactions/transactions.component';
import { TransactionDialogComponent } from './transactions/transaction-dialog/transaction-dialog.component';
import { ErrorsComponent } from './errors/errors.component';
import { AccumulatedTransactionErrorsComponent } from './errors/accumulated-transaction-errors/accumulated-transaction-errors.component';
import { ClearingErrorsComponent } from './errors/clearing-errors/clearing-errors.component';
import { SettlementErrorsComponent } from './errors/settlement-errors/settlement-errors.component';

const routes: Routes = [
  {
    path: 'clearing',
    component: ACSSComponent,
  },
  {
    path: 'clearing/:id',
    component: ClearingDetailComponent,
  },
  {
    path: 'clearing/:id/accumulated-transaction-detail/:accumulatedTransactionId',
    component: TransactionsComponent,
  },
  {
    path: 'settlement',
    component: SettlementComponent,
  },
  {
    path: 'errors',
    component: ErrorsComponent,
  }
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FuseWidgetModule
  ],
  entryComponents: [TransactionDialogComponent],
  declarations: [
    ACSSComponent,
    ClearingDetailComponent,
    ClearingComponent,
    SettlementComponent,
    TransactionsComponent,
    TransactionDialogComponent,
    ErrorsComponent,
    AccumulatedTransactionErrorsComponent,
    ClearingErrorsComponent,
    SettlementErrorsComponent
  ],
  providers: [ ACSSService, ClearingDetailService, ClearingService, DatePipe]
})

export class ACSSModule {}
