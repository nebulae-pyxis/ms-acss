import {Component, Inject, OnInit} from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA} from '@angular/material';

import { FuseTranslationLoaderService } from "../../../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";

@Component({
  selector: 'app-transaction-dialog',
  templateUrl: './transaction-dialog.component.html',
  styleUrls: ['./transaction-dialog.component.scss']
})
export class TransactionDialogComponent implements OnInit {

  transaction: any = null;

  constructor(public dialogRef: MatDialogRef<TransactionDialogComponent>, 
    @Inject(MAT_DIALOG_DATA) public data: any,
    private translate: TranslateService, private translationLoader: FuseTranslationLoaderService) {    
  }

  ngOnInit() {
    this.transaction = this.data;
  }

}
