import { ACSSService } from './acss.service';

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
import { KeycloakService } from 'keycloak-angular';

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "./../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "./i18n/en";
import { locale as spanish } from "./i18n/es";

//////////// ANGULAR MATERIAL ///////////
import {
  MatPaginator,
  MatSort,
  Sort,
  MatTableDataSource,
  MatDialog,
  MatSnackBar
} from "@angular/material";
import { fuseAnimations } from '../../../core/animations';

////////// RXJS ///////////
// tslint:disable-next-line:import-blacklist
import * as Rx from "rxjs/Rx";
import { map, mergeMap, toArray, filter, tap } from "rxjs/operators";
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'acss',
  templateUrl: './acss.component.html',
  styleUrls: ['./acss.component.scss'],
  animations: fuseAnimations
})
export class ACSSComponent implements OnInit, OnDestroy {

  userRoles: any;
  isSystemAdmin: Boolean = false;
  // Rxjs subscriptions
  subscriptions = [];
   // Columns to show in the table
  displayedColumns = ['timestamp', 'lastUpdateTimestamp', 'open', 'projected_balance'];
  // Table data
  dataSource = new MatTableDataSource();
  businessForm: FormGroup;
  businessQuery$: Rx.Observable<any>;
  selectedBusiness: any = null;
  selectedClearing: any = null;

  //Table values
  @ViewChild(MatPaginator) paginator: MatPaginator;
  @ViewChild("filter") filter: ElementRef;
  @ViewChild(MatSort) sort: MatSort;
  tableSize: number;
  page = 0;
  count = 10;
  filterText = "";
  sortColumn = null;
  sortOrder = null;
  itemPerPage = "";

  constructor(
    private formBuilder: FormBuilder,
    private aCSSService: ACSSService,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private keycloakService: KeycloakService,
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.checkIfUserIsSystemAdmin();
    // this.createBusinessObservable();
    // this.createDummy();
  }

  /**
   * Finds the clearings
   * @param page page number
   * @param count Limits the number of documents in the result set
   * @param businessId Business ID filter
   */
  refreshDataTable(page, count, businessId) {
    this.subscriptions.push(this.aCSSService
      .getClearingsFromBusiness$(page, count, businessId)
      .pipe(
        mergeMap(resp => this.graphQlAlarmsErrorHandler$(resp)),
        filter((resp: any) => !resp.errors || resp.errors.length === 0),
      ).subscribe(model => {
        this.dataSource.data = model.data.getAllClearingsFromBusiness;
      }));
  }

  createDummy(){
    this.dataSource.data = [
      {_id: 1, timestamp: 1536705058916, lastUpdateTimestamp: 1536705058916, state: 'CLOSE', projectedBalance: 200.000}
    ];
  }

  /**
   * Checks if the user is system admin
   */
  async checkIfUserIsSystemAdmin(){
    this.userRoles = await this.keycloakService.getUserRoles(true);

    this.isSystemAdmin = this.userRoles.some(role => role === 'system-admin');

    if (!this.isSystemAdmin){
      this.getBusiness$();      
    }
    this.refreshDataTable(this.page, this.count, undefined);
  }

  /**
   * get the business which the user belongs
   */
  getBusiness$(){
    this.subscriptions.push(this.aCSSService.getACSSBusiness$()
    .pipe(
      map(res => res.data.getACSSBusiness)
    ).subscribe(business => {
      this.selectedBusiness = business;
    }));
  }

  /**
   * Creates an observable of business
   */
  createBusinessObservable(){
    this.businessQuery$ = this.aCSSService.getACSSBusinesses$().pipe(
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
   * Creates the business detail form and its validations
   */
  createBusinessForm() {
    return this.formBuilder.group({
      business: new FormControl(null, Validators.required)
    });
  }

  /**
   * Receives the selected clearing
   * @param clearing selected clearing
   */
  selectClearingRow(clearing){
    this.selectedClearing = clearing;
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
            response.errors.forEach(error => {
              this.showMessageSnackbar('ERRORS.' + error.message.code);
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
    if(messageKey){
      translationData.push(messageKey);
    }

    if(detailMessageKey){
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
