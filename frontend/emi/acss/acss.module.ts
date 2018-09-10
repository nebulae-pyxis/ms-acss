import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../core/modules/shared.module';
import { DatePipe } from '@angular/common';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';

import { ACSSService } from './acss.service';
import { ACSSComponent } from './acss.component';
import { ClearingComponent } from './clearing/clearing.component';
import { SettlementComponent } from './settlement/settlement.component';

const routes: Routes = [
  {
    path: '',
    component: ACSSComponent,
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
    ClearingComponent,
    SettlementComponent    
  ],
  providers: [ ACSSService, DatePipe]
})

export class ACSSModule {}