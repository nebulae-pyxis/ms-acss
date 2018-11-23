////////// ANGULAR //////////
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import { ACSSService } from '../../acss.service';

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "../../../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "../../i18n/en";
import { locale as spanish } from "../../i18n/es";

//////////// ANGULAR MATERIAL ///////////
import {animate, state, style, transition, trigger} from '@angular/animations';
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
  MatSnackBar
} from "@angular/material";

////////// RXJS ///////////
// tslint:disable-next-line:import-blacklist
import * as Rx from "rxjs/Rx";
import { map, mapTo, mergeMap, filter, tap, toArray } from "rxjs/operators";

@Component({
  selector: 'app-clearing-errors',
  templateUrl: './clearing-errors.component.html',
  styleUrls: ['./clearing-errors.component.scss'],
    animations: [
    trigger('detailExpand', [
      state('collapsed', style({height: '0px', minHeight: '0', display: 'none'})),
      state('expanded', style({height: '*'})),
      transition('expanded <=> collapsed', animate('225ms cubic-bezier(0.4, 0.0, 0.2, 1)')),
    ]),
  ],
})
export class ClearingErrorsComponent implements OnInit, OnDestroy {

  // Rxjs subscriptions
  subscriptions = [];
  // Columns to show in the table
  displayedColumns = [
    'timestamp',
    'error'
  ];
  // Table data
  dataSource = new MatTableDataSource();

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
    private acssService: ACSSService,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute
  ) { }

  ngOnInit() {
    this.refreshTable();
  }

  /**
   * Load the transaction on the table and update the data if the paginator is changed
   */
  refreshTable(){
    this.subscriptions.push(
      Rx.Observable.defer(() =>
        this.getPaginator$()
      )
        .pipe(
          mergeMap(paginator => this.acssService.getClearingErrors$(
            paginator.pageIndex,
            paginator.pageSize
          )),
          mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),          
          filter((resp: any) => !resp.errors || resp.errors.length === 0),
          map(resp => resp.data.getClearingErrors),
          mergeMap(clearingErrors => this.acssService.getClearingErrorsCount$()
          .map(count => [clearingErrors, count.data.getClearingErrorsCount]))
        )
        .subscribe(([clearingErrors, count]) => {
          this.dataSource = clearingErrors;
          this.tableSize = count;
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
   * Convert the event to JSON String
   */
  convertToJsonString(log){
    return JSON.stringify(log.event) 
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
