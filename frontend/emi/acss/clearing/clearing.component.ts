//////////// ANGULAR MATERIAL ///////////
import {
  MatTableDataSource,
} from '@angular/material';

////////// ANGULAR //////////
import { Component, OnInit, OnDestroy, Input } from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from "@angular/forms";

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "../../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "../i18n/en";
import { locale as spanish } from "../i18n/es";


import { Clearing } from './entities/clearing';

@Component({
  selector: 'app-clearing',
  templateUrl: './clearing.component.html',
  styleUrls: ['./clearing.component.scss']
})
export class ClearingComponent implements OnInit {

  @Input() clearing: Clearing;

  // Incomes Table data
  incomesDataSource = new MatTableDataSource();

  // Outcomes Table data
  outcomesDataSource = new MatTableDataSource();

  // Partial settlement - Incomes Table data
  partialSettlementIncomesDataSource = new MatTableDataSource();

  // Partial settlement - Outcomes Table data
  partialSettlementOutcomesDataSource = new MatTableDataSource();

  // Cumulated transactions table
  cumulatedTransactionsDataSource = new MatTableDataSource();

  // Columns to show in the table
  displayedColumns = ['businessName', 'value'];

  // Columns to show in the cumulated transactions table
  displayedColumnsCumulatedTransactions = ['date', 'from', 'to', 'value'];

  selectedCumulatedTransaction: any = null;

  constructor(private formBuilder: FormBuilder,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.createDummy();
    this.clearing = new Clearing();
    this.clearing.timestamp = new Date();
    this.clearing.open = false;
    this.clearing.input = {
      nebula: {
        amount: 200.000
      }
    };
    this.clearing.output = {
      nebula: {
        amount: 200.000
      }
    };
  }

  createDummy(){
    this.incomesDataSource.data = [
      {businessId: 123, businessName: 'Negocio1', value: 200000},
      {businessId: 12, businessName: 'Negocio2', value: 15000},
      {businessId: 23, businessName: 'Negocio3', value: 34000},
      {businessId: 123, businessName: 'Negocio1', value: 200000},
      {businessId: 12, businessName: 'Negocio2', value: 15000}
    ];

    this.outcomesDataSource.data = [
      {businessId: 123, businessName: 'Negocio1', value: 200000},
      {businessId: 12, businessName: 'Negocio2', value: 15000},
      {businessId: 23, businessName: 'Negocio3', value: 34000},
      {businessId: 1, businessName: 'Negocio4', value: 125000},
      {businessId: 12, businessName: 'Negocio5', value: 15000},
    ];

    this.partialSettlementIncomesDataSource.data = [
      {businessId: 123, businessName: 'Negocio1', value: 200000},
      {businessId: 12, businessName: 'Negocio2', value: 15000},
      {businessId: 23, businessName: 'Negocio3', value: 34000},
      {businessId: 1, businessName: 'Negocio4', value: 125000},
    ];

    this.partialSettlementOutcomesDataSource.data = [
      {businessId: 123, businessName: 'Negocio1', value: 200000},
      {businessId: 12, businessName: 'Negocio2', value: 15000},
      {businessId: 23, businessName: 'Negocio3', value: 34000},
      {businessId: 1, businessName: 'Negocio4', value: 125000},
    ];

    this.cumulatedTransactionsDataSource.data = [
      {_id: '1', date: 1536680334509, from: 'Negocio1', to: 'Negocio2', value: -30000, txIds: {
        'AFCC': [1, 2, 3]
      }},
      {_id: '2', date: 1536680334510, from: 'Negocio2', to: 'Negocio1', value: 10000, txIds: {
        'AFCC': [3]
      }},
      {_id: '3', date: 1536680334513, from: 'NegocioT', to: 'NegocioA', value: 25000, txIds: {
        'AFCC': [32]
      }}
    ];
  }

  /**
   * Receives the selected cumulated transaction
   * @param cumulatedTransaction selected cumulated transaction
   */
  selectCumulatedTransactionRow(cumulatedTransaction){
    this.selectedCumulatedTransaction = cumulatedTransaction;
    console.log('selectedcumulatedTransactions1 => ', this.selectCumulatedTransactionRow);
  }

  /**
   * converts milliseconds to date
   * @returns {Date} returns the date
   */
  convertMillisToDate(millis){
    return new Date(millis);
  }

}
