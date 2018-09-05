import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { SharedModule } from '../../../core/modules/shared.module';
import { DatePipe } from '@angular/common';
import { FuseWidgetModule } from '../../../core/components/widget/widget.module';

import { msnamecamelService } from './msname.service';
import { msnamecamelComponent } from './msname.component';

const routes: Routes = [
  {
    path: '',
    component: msnamecamelComponent,
  }
];

@NgModule({
  imports: [
    SharedModule,
    RouterModule.forChild(routes),
    FuseWidgetModule
  ],
  declarations: [
    msnamecamelComponent    
  ],
  providers: [ msnamecamelService, DatePipe]
})

export class msnamecamelModule {}