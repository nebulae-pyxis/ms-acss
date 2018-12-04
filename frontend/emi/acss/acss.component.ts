import { ACSSService } from "./acss.service";

////////// ANGULAR //////////
import {
  Component,
  OnInit,
  ViewChild,
  ElementRef,
  OnDestroy
} from "@angular/core";
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from "@angular/forms";
import { KeycloakService } from "keycloak-angular";

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "./../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "./i18n/en";
import { locale as spanish } from "./i18n/es";

//////////// ANGULAR MATERIAL ///////////
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
  MatSnackBar
} from "@angular/material";
import { fuseAnimations } from "../../../core/animations";

////////// RXJS ///////////
// tslint:disable-next-line:import-blacklist
import * as Rx from "rxjs/Rx";
import {
  map,
  mergeMap,
  toArray,
  filter,
  tap,
  combineLatest
} from "rxjs/operators";

@Component({
  // tslint:disable-next-line:component-selector
  selector: "acss",
  templateUrl: "./acss.component.html",
  styleUrls: ["./acss.component.scss"],
  animations: fuseAnimations
})
export class ACSSComponent implements OnInit, OnDestroy {
  // userRoles: any;
  isSystemAdmin: Boolean = false;
  // Rxjs subscriptions
  subscriptions = [];
  // Columns to show in the table
  displayedColumns = [
    'timestamp',
    'lastUpdateTimestamp',
    'open',
    'balance'
  ];
  // Table data
  dataSource = new MatTableDataSource();
  myBusiness: any = null;
  businessForm: FormGroup;
  businessQuery$: Rx.Observable<any>;
  businessUserLogged: any = null;
  allBusiness: any = [];
  selectedBusinessData: any = null;
  selectedClearing: any = null;
  //selectedBusinessSubject: Rx.Subject<any> = new Rx.Subject();

  // Table values
  @ViewChild(MatPaginator)
  paginator: MatPaginator;
  @ViewChild('filter')
  filter: ElementRef;
  @ViewChild(MatSort)
  sort: MatSort;
  tableSize: number;
  page = 0;
  count = 10;
  filterText = '';
  sortColumn = null;
  sortOrder = null;
  itemPerPage = '';

  constructor(
    private formBuilder: FormBuilder,
    private aCSSService: ACSSService,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private keycloakService: KeycloakService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.businessForm = this.createBusinessForm();
    this.refreshTable();
  }

  /**
   * Creates the business detail form and its validations
   */
  createBusinessForm() {
    return this.formBuilder.group({
      business: new FormControl(null, Validators.required)
    });
  }

  /**
   * Refresh the info of the table according to the paginator and the selected business
   */
  refreshTable() {
    this.subscriptions.push(
      Rx.Observable.combineLatest(
        this.loadBusinessData$(),
        this.getPaginator$(),
        this.aCSSService.selectedBusinessEvent$.startWith(null)
      )
        .pipe(
          mergeMap(([businessData, paginator, selectedBusiness]) => {
            const isAdmin = businessData[0];
            const businessUser = businessData[1];
            if (!selectedBusiness && isAdmin) {
              return Rx.Observable.of([]).map(clearings => [
                businessData,
                clearings
              ]);
            }
            return this.getClearingsFromBusiness$(
              paginator.pageIndex,
              paginator.pageSize,
              isAdmin ? selectedBusiness._id : businessUser._id
            )
              .map(clearings => clearings.data.getAllClearingsFromBusiness)
              .map(clearings => [businessData, clearings, selectedBusiness]);
          })
        )
        .subscribe(([businessData, clearings, selectedBusiness]) => {
          this.isSystemAdmin = businessData[0];
          this.myBusiness = businessData[1];
          this.allBusiness = businessData[2];
          this.selectedBusinessData = selectedBusiness;          
          this.dataSource.data = clearings;
        })
    );
  }

  /**
   * Finds the clearings
   * @param page page number
   * @param count Limits the number of documents in the result set
   * @param businessId Business ID filter
   */
  getClearingsFromBusiness$(page, count, businessId) {
    return this.aCSSService
      .getClearingsFromBusiness$(page, count, businessId)
      .pipe(
        mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
        filter((resp: any) => !resp.errors || resp.errors.length === 0)
      );
  }

  /**
   * Listens when a new business have been selected
   * @param business  selected business
   */
  onSelectBusinessEvent(business) {
    this.aCSSService.selectedBusiness(business);
    // this.selectedBusinessSubject.next(business);
  }

  /**
   * Paginator of the table
   */
  getPaginator$() {
    return this.paginator.page.startWith({ pageIndex: 0, pageSize: 10 });
  }

  loadBusinessData$() {
    return Rx.Observable.of(this.keycloakService.getUserRoles(true)).pipe(
      mergeMap(userRoles => {
        const isAdmin = userRoles.some(role => role === 'PLATFORM-ADMIN');
        return Rx.Observable.forkJoin(
          Rx.Observable.of(isAdmin),
          this.getBusiness$(),
          isAdmin ? this.getAllBusiness$() : Rx.Observable.of([])
        );
      })
    );
  }

  /**
   * get the business which the user belongs
   */
  getBusiness$() {
    return this.aCSSService
      .getACSSBusiness$()
      .pipe(
        map(res => res.data.getACSSBusiness)
      );
  }

  /**
   * Creates an observable of business
   */
  getAllBusiness$() {
    return this.aCSSService.getACSSBusinesses$().pipe(
      mergeMap(res => {
        return Rx.Observable.from(res.data.getACSSBusinesses);
      }),
      map((business: any) => {
        return {
          _id: business._id,
          name: business.name
        };
      }),
      toArray()
    );
  }

  /**
   * Receives the selected clearing
   * @param clearing selected clearing
   */
  selectClearingRow(clearing) {
    this.selectedClearing = clearing;
  }


  /**
   * Calculates the projected balance according to the clearing info
   * @param clearing Clearing info
   */
  calculateProjectedBalance(clearing) {
    const inputs = clearing.input.reduce((acc, inputB) => acc + inputB.amount, 0);
    const outputs = clearing.output.reduce((acc, outputB) => acc + outputB.amount, 0);
    const partialSettlementOutputs = clearing.partialSettlement.output.reduce((acc, outputB) => acc + outputB.amount, 0);
    const partialSettlementInputs = clearing.partialSettlement.input.reduce((acc, inputB) => acc + inputB.amount, 0);
    return (inputs + partialSettlementInputs) - (outputs + partialSettlementOutputs);
  }

    // /**
  //  * Finds the clearings
  //  * @param page page number
  //  * @param count Limits the number of documents in the result set
  //  * @param businessId Business ID filter
  //  */
  // refreshDataTable(page, count, businessId) {
  //   this.subscriptions.push(
  //     this.aCSSService
  //       .getClearingsFromBusiness$(page, count, businessId)
  //       .pipe(
  //         mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
  //         filter((resp: any) => !resp.errors || resp.errors.length === 0)
  //       )
  //       .subscribe(model => {
  //         this.dataSource.data = model.data.getAllClearingsFromBusiness;
  //       })
  //   );
  // }

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
            response.errors.forEach(error => {
              this.showMessageSnackbar("ERRORS." + error.message.code);
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
