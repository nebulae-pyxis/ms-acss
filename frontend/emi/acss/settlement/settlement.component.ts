////////// ANGULAR //////////
import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  ElementRef
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";

////////// RXJS ///////////
// tslint:disable-next-line:import-blacklist
import * as Rx from "rxjs/Rx";
import { mergeMap, filter, tap, map } from "rxjs/operators";

//////////// ANGULAR MATERIAL ///////////
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
  MatSnackBar
} from "@angular/material";
import { fuseAnimations } from "../../../../core/animations";

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "../../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "../i18n/en";
import { locale as spanish } from "../i18n/es";

import { ClearingService } from "../clearing/clearing.service";
import { Clearing } from '../entities/clearing';

@Component({
  selector: "app-settlement",
  templateUrl: "./settlement.component.html",
  styleUrls: ["./settlement.component.scss"]
})
export class SettlementComponent implements OnInit, OnDestroy {
  @Input() selectedClearing: Clearing;

  // Rxjs subscriptions
  subscriptions = [];
  // Columns to show in the table
  displayedColumns = ["timestamp", "from", "to", "amount"];
  // Table data
  dataSource = new MatTableDataSource();
  businessQuery$: Rx.Observable<any>;
  selectedAccumulatedTransaction: any = null;

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
    private activatedRouter: ActivatedRoute
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.refreshTable();
  }

  /**
   * Paginator of the table
   */
  getPaginator$() {
    return this.paginator.page.startWith({ pageIndex: 0, pageSize: 10 });
  }

  /**
   * Load the settlements on the table and update the data if the paginator is changed.
   *
   * Each time
   */
  refreshTable() {
    this.subscriptions.push(
      this.getPaginator$()
      .pipe(
        //Get the settlements associated to the clearing
          mergeMap(paginator =>
            this.clearingService.getSettlementsByClearingId$(
              paginator.pageIndex,
              paginator.pageSize,
              this.selectedClearing._id
            )
          ),
          mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
          filter((resp: any) => !resp.errors || resp.errors.length === 0),
          //Refresh the amount of settlements of the table
          mergeMap(settlementData =>
            this.clearingService
              .getSettlementsCountByClearingId$(this.selectedClearing._id)
              .map(countData => [
                settlementData.data.getSettlementByClearingId,
                countData.data
              ])
          )
        )
        .subscribe(([settlements, count]) => {
          console.log("settlements => ", settlements, count);
          this.dataSource = settlements;
          this.tableSize = count;
        })
    );
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
