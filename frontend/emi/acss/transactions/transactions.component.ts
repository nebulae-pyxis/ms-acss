import { TransactionDialogComponent } from './transaction-dialog/transaction-dialog.component';
import { Observable } from "rxjs/Observable";
////////// ANGULAR //////////
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "../../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "../i18n/en";
import { locale as spanish } from "../i18n/es";

//////////// ANGULAR MATERIAL ///////////
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
  MatSnackBar,
  MatDialog
} from "@angular/material";
import { fuseAnimations } from "../../../../core/animations";

////////// RXJS ///////////
// tslint:disable-next-line:import-blacklist
import * as Rx from "rxjs/Rx";
import { map, mapTo, mergeMap, filter, tap, toArray } from "rxjs/operators";
import { ClearingService } from "../clearing/clearing.service";

@Component({
  selector: "app-transactions",
  templateUrl: "./transactions.component.html",
  styleUrls: ["./transactions.component.scss"]
})
export class TransactionsComponent implements OnInit, OnDestroy {
  // Rxjs subscriptions
  subscriptions = [];
  // Columns to show in the table
  displayedColumns = ["timestamp", "from", "to", "type", "amount"];
  // Table data
  dataSource = new MatTableDataSource();
  businessQuery$: Rx.Observable<any>;
  selectedAccumulatedTransaction: any = null;
  selectedTransaction: any = null;
  expandedElement: any = null;

  //Table values
  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  @ViewChild("filter")
  filter: ElementRef;
  @ViewChild(MatSort)
  sort: MatSort;
  tableSize: number;
  page = 0;
  count = 10;
  filterText = "";
  sortColumn = null;
  sortOrder = null;
  itemPerPage = "";  

  constructor(
    private clearingService: ClearingService,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    public dialog: MatDialog
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.refreshTable();
  }

  /**
   * gets the text data to show in the tooltip
   * @param transaction 
   */
  getToolTipData(transaction){
    return JSON.stringify(transaction.channel)
  }

  openDialog(transaction): void {
    this.selectedTransaction = transaction;
    const dialogRef = this.dialog.open(TransactionDialogComponent, {
      width: '350px',
      data: transaction
    });
  }

  /**
   * Load the transaction on the table and update the data if the paginator is changed
   */
  refreshTable(){
    this.subscriptions.push(
      Rx.Observable.combineLatest(
        this.getTransactionsIds$(),
        this.getPaginator$()
      )
        .pipe(
          mergeMap(([txIds, paginator]) => {
            const txIdsArray = [];
            txIds.forEach(tx => {
              txIdsArray.push(...tx.ids);
            });
            this.tableSize = txIdsArray.length;

            return this.clearingService.getTransactionsByIds$(
              paginator.pageIndex,
              paginator.pageSize,
              null,
              txIdsArray
            );
          }),
          mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),          
          filter((resp: any) => !resp.errors || resp.errors.length === 0),
          map(resp => resp.data.getTransactionsByIds)
        )
        .subscribe(transactions => {
          console.log("transactions => ", transactions);
          this.dataSource = transactions;
        })
    );
  }

  /**
   * get the transactions ids
   */
  getTransactionsIds$() {
    return this.activatedRouter.params.pipe(
      mergeMap(params =>
        this.clearingService.getAccumulatedTransactionsByIds$(
          0,
          1,
          params.accumulatedTransactionId
        )
      ),
      map((res: any) => {
        //this.selectedAccumulatedTransaction = res.data.getAccumulatedTransactionsByIds[0];
        return res.data.getAccumulatedTransactionsByIds[0].transactionIds;
      })
    );
  }

  /**
   * Paginator of the table
   */
  getPaginator$() {
    return this.paginator.page.startWith({ pageIndex: 0, pageSize: 10 });
  }

  /**
   * Handles the Graphql errors and show a message to the user
   * @param response
   */
  graphQlAlarmsErrorHandler$(response) {
    return Rx.Observable.of(JSON.parse(JSON.stringify(response))).pipe(
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
  showSnackBarError(response) {
    if (response.errors) {
      if (Array.isArray(response.errors)) {
        response.errors.forEach(error => {
          if (Array.isArray(error)) {
            error.forEach(errorDetail => {
              this.showMessageSnackbar("ERRORS." + errorDetail.message.code);
            });
          } else {
            response.errors.forEach(err => {
              this.showMessageSnackbar("ERRORS." + err.message.code);
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
  showMessageSnackbar(messageKey, detailMessageKey?) {
    let translationData = [];
    if (messageKey) {
      translationData.push(messageKey);
    }

    if (detailMessageKey) {
      translationData.push(detailMessageKey);
    }

    this.translate.get(translationData).subscribe(data => {
      this.snackBar.open(
        messageKey ? data[messageKey] : "",
        detailMessageKey ? data[detailMessageKey] : "",
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
