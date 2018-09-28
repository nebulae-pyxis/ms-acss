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
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from "@angular/forms";

////////// RXJS ///////////
// tslint:disable-next-line:import-blacklist
import * as Rx from "rxjs/Rx";
import { map, mergeMap, toArray, filter, tap, takeUntil } from "rxjs/operators";
import { Subject } from 'rxjs';

//////////// ANGULAR MATERIAL ///////////
import {
  MatPaginator,
  MatSort,
  MatTableDataSource,
  MatSnackBar
} from "@angular/material";
import { fuseAnimations } from "../../../../core/animations";
import { KeycloakService } from "keycloak-angular";

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "../../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "../i18n/en";
import { locale as spanish } from "../i18n/es";

import { ACSSService } from "../acss.service";
import { Clearing } from "../entities/clearing";

@Component({
  selector: "app-settlement",
  templateUrl: "./settlement.component.html",
  styleUrls: ["./settlement.component.scss"],
  animations: fuseAnimations
})
export class SettlementComponent implements OnInit, OnDestroy {
  private ngUnsubscribe = new Subject();
  // userRoles: any;
  isSystemAdmin: Boolean = false;
  myBusiness: any = null;
  @Input()
  selectedClearing: Clearing;
  // Columns to show in the table
  displayedColumns = ["timestamp", "from", "to", "amount" ];
  // Table data
  dataSource = new MatTableDataSource();
  businessForm: FormGroup;
  businessQuery$: Rx.Observable<any>;
  selectedAccumulatedTransaction: any = null;
  selectedBusinessData: any = null;
  allBusiness: any = [];

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
    private formBuilder: FormBuilder,
    private acssService: ACSSService,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private router: Router,
    private activatedRouter: ActivatedRoute,
    private keycloakService: KeycloakService,
    private aCSSService: ACSSService
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
   * Paginator of the table
   */
  getPaginator$() {
    return this.paginator.page.startWith({ pageIndex: 0, pageSize: 10 });
  }

  refreshTable() {
      Rx.Observable.combineLatest(
        this.loadBusinessData$(),
        this.getPaginator$(),
        this.acssService.selectedBusinessEvent$.startWith(null)
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
            return this.acssService
              .getSettlementsByBusinessId$(
                paginator.pageIndex,
                paginator.pageSize,
                isAdmin ? selectedBusiness._id : businessUser._id
              )
              .map(clearings => clearings.data.getSettlementsByBusinessId)
              .map(clearings => [businessData, clearings, selectedBusiness]);
          }),
          takeUntil(this.ngUnsubscribe)
        )
        .subscribe(([businessData, settlements, selectedBusiness]) => {
          this.isSystemAdmin = businessData[0];
          this.myBusiness = businessData[1];
          this.allBusiness = businessData[2];
          this.selectedBusinessData = selectedBusiness;
          
          this.dataSource.data = settlements;

          if(!this.isSystemAdmin){
            this.displayedColumns = ["timestamp", "from", "to", "amount", "state" ]
          }else{
            this.displayedColumns = ["timestamp", "from", "to", "amount", "fromBusinessState", "toBusinessState" ]
          }
        });
  }

  /**
   * Loads business data
   */
  loadBusinessData$() {
    return Rx.Observable.of(this.keycloakService.getUserRoles(true)).pipe(
      mergeMap(userRoles => {
        const isAdmin = userRoles.some(role => role === "SYSADMIN");
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
      .pipe(map(res => res.data.getACSSBusiness));
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
   * Listens when a new business have been selected
   * @param business  selected business
   */
  onSelectBusinessEvent(business) {
    this.acssService.selectedBusiness(business);
  }

    /**
   * Listens when a new business have been selected
   * @param business  selected business
   */
  onChangeSettlementState(newState, settlement) {
    console.log('onchangeSettlementState => ', newState, settlement);

    Rx.Observable.of({settlement, newState})
    .pipe(
      mergeMap(settlementData => this.acssService.changeSettlementState$(settlementData.settlement._id, settlementData.newState)),
      mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
      filter((resp: any) => !resp.errors || resp.errors.length === 0),
      takeUntil(this.ngUnsubscribe)
    ).subscribe(model => {
      this.snackBar.open("Estado actualizado", "Cerrar", {
                duration: 2000
              });
    },
          error => {
            console.log('Error cambiando estado de compensación ==> ', error);
          });



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
    this.ngUnsubscribe.next();
    this.ngUnsubscribe.complete();
  }
}
