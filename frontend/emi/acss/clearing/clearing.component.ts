////////// RXJS ///////////
// tslint:disable-next-line:import-blacklist
import * as Rx from "rxjs/Rx";
import {  mergeMap, filter, tap } from "rxjs/operators";

//////////// ANGULAR MATERIAL ///////////
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
  MatSnackBar
} from "@angular/material";
import { fuseAnimations } from '../../../../core/animations';

////////// ANGULAR //////////
import { Component, OnInit, OnDestroy, Input, ViewChild, ElementRef } from "@angular/core";

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "../../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "../i18n/en";
import { locale as spanish } from "../i18n/es";

import { ClearingService } from './clearing.service';
import { Clearing } from '../entities/clearing';

@Component({
  selector: 'app-clearing',
  templateUrl: './clearing.component.html',
  styleUrls: ['./clearing.component.scss']
})
export class ClearingComponent implements OnInit, OnDestroy {

  @Input() clearing: Clearing;

  // Rxjs subscriptions
  subscriptions = [];

  // Incomes Table data
  incomesDataSource = new MatTableDataSource<Element>();

  // Incomes table length
  incomesResultsLength = 0;

  // Outcomes Table data
  outcomesDataSource = new MatTableDataSource<Element>();

  // Outcomes table length
  outcomesResultsLength = 0;

  // Partial settlement - Incomes Table data
  partialSettlementIncomesDataSource = new MatTableDataSource<Element>();

  // partial settlement Incomes table length
  partialSettlementIncomesResultsLength = 0;

  // Partial settlement - Outcomes Table data
  partialSettlementOutcomesDataSource = new MatTableDataSource<Element>();

  // partial settlement Outcomes table length
  partialSettlementOutcomesResultsLength = 0;

  // Cumulated transactions table
  accumulatedTransactionsDataSource = new MatTableDataSource();

  // Columns to show in the table
  displayedColumns = ['businessName', 'value'];

  // Columns to show in the acccumulated transactions table
  displayedColumnsAccumulatedTransactions = ['date', 'from', 'to', 'value'];

  selectedaccumulatedTransaction: any = null;

    // Table values
    @ViewChild('paginatorAccumulatedTxs') paginatorAccumulatedTxs: MatPaginator;
    @ViewChild('paginatorIncomes') paginatorIncomes: MatPaginator;
    @ViewChild('paginatorOutcomes') paginatorOutcomes: MatPaginator;
    @ViewChild('paginatorPartialSettlementIncomes') paginatorPartialSettlementIncomes: MatPaginator;
    @ViewChild('paginatorPartialSettlementOutcomes') paginatorPartialSettlementOutcomes: MatPaginator;
    @ViewChild('filter') filter: ElementRef;
    @ViewChild(MatSort) sort: MatSort;
    tableSize: number;
    page = 0;
    count = 10;
    filterText = '';
    sortColumn = null;
    sortOrder = null;
    itemPerPage = '';

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private clearingService: ClearingService,
    private snackBar: MatSnackBar
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.refreshTables();
  }

  /**
   * Refresh the tables
   */
  refreshTables(){
    //this.incomesDataSource.data = this.clearing.input;
    this.incomesDataSource = new MatTableDataSource<Element>(this.clearing.input);
    // this.incomesDataSource.paginator = this.paginatorIncomes;
    this.incomesResultsLength = this.clearing.input.length;

    this.outcomesDataSource = new MatTableDataSource<Element>(this.clearing.output);
    // this.outcomesDataSource.paginator = this.paginatorOutcomes;
    this.outcomesResultsLength = this.clearing.output.length;

    this.partialSettlementIncomesDataSource.data = this.clearing.partialSettlement.input;
    //this.partialSettlementIncomesDataSource.paginator = this.paginatorPartialSettlementIncomes;
    this.partialSettlementIncomesResultsLength = this.clearing.partialSettlement.input.length;

    this.partialSettlementOutcomesDataSource.data = this.clearing.partialSettlement.output;
    //this.partialSettlementOutcomesDataSource.paginator = this.paginatorPartialSettlementOutcomes;
    this.partialSettlementOutcomesResultsLength = this.clearing.partialSettlement.output.length;

    const accumulatedTxSubscription = this.paginatorAccumulatedTxs.page
      .startWith({pageIndex: 0, pageSize: 10})
      .pipe(
        mergeMap(paginatorData => {
          console.log('Paginator changed ', paginatorData);
          return this.clearingService.getAccumulatedTransactionsByIds$(paginatorData.pageIndex, paginatorData.pageSize, this.clearing.accumulatedTransactionIds);
        }),
        mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
        filter((resp: any) => !resp.errors || resp.errors.length === 0),        
      ).subscribe(model => {
        this.accumulatedTransactionsDataSource.data = model.data.getAccumulatedTransactionsByIds;
      });
      this.subscriptions.push(accumulatedTxSubscription);
  }

  /**
   * Receives the selected cumulated transaction
   * @param cumulatedTransaction selected cumulated transaction
   */
  selectAccumulatedTransactionRow(accumulatedTransaction){
    this.selectedaccumulatedTransaction = accumulatedTransaction;
    console.log('selectedcumulatedTransactions1 => ', this.selectedaccumulatedTransaction);
    
  }

  /**
   * converts milliseconds to date
   * @returns {Date} returns the date
   */
  convertMillisToDate(millis){
    return new Date(millis);
  }

  /**
   * Calculates the projected balance according to the clearing info
   * @param clearing Clearing info
   */
  calculateProjectedBalance(clearing){
    const inputs = clearing.input.reduce((inputA,inputB) => {
      return inputA.amount || 0 + inputB.amount || 0;
    }, 0);

    const outputs = clearing.output.reduce((outputA,outputB) => {
      return outputA.amount || 0 + outputB.amount || 0;
    }, 0);

    const partialSettlementOutputs = clearing.partialSettlement.input.reduce((outputA,outputB) => {
      return outputA.amount + outputB.amount;
    }, 0);

    const partialSettlementInputs = clearing.partialSettlement.input.reduce((inputA,inputB) => {
      return inputA.amount + inputB.amount;
    }, 0);

    return (inputs + partialSettlementInputs) - (outputs + partialSettlementOutputs);
  }

     /**
   * Handles the Graphql errors and show a message to the user
   * @param response
   */
  graphQlAlarmsErrorHandler$(response){
    return Rx.Observable.of(JSON.parse(JSON.stringify(response)))
    .pipe(
      tap((resp: any) => {
        this.showSnackBarError(resp);
        return resp;
      })
    );
  }

    /**
   * Shows an error snackbar
   * @param response
   */
  showSnackBarError(response){
    if (response.errors){

      if (Array.isArray(response.errors)) {
        response.errors.forEach(error => {
          if (Array.isArray(error)) {
            error.forEach(errorDetail => {
              this.showMessageSnackbar('ERRORS.' + errorDetail.message.code);
            });
          }else{
            response.errors.forEach(err => {
              this.showMessageSnackbar('ERRORS.' + err.message.code);
            });
          }
        });
      }
    }
  }

    /**
   * Shows a message snackbar on the bottom of the page
   * @param messageKey Key of the message to i18n
   * @param detailMessageKey Key of the detail message to i18n
   */
  showMessageSnackbar(messageKey, detailMessageKey?){
    let translationData = [];
    if (messageKey){
      translationData.push(messageKey);
    }

    if (detailMessageKey){
      translationData.push(detailMessageKey);
    }

    this.translate.get(translationData)
    .subscribe(data => {
      this.snackBar.open(
        messageKey ? data[messageKey]: '',
        detailMessageKey ? data[detailMessageKey]: '',
        {
          duration: 2000
        }
      );
    });
  }


  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.forEach(sub => {
        sub.unsubscribe();
      });
    }
  }

}
