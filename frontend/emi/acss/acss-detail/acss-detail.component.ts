import { ACSSDetailService } from './acss-detail.service';

////////// ANGULAR //////////
import { Component, OnInit, OnDestroy } from "@angular/core";
import { Router, ActivatedRoute } from "@angular/router";
import {
  FormBuilder,
  FormGroup,
  FormControl,
  Validators
} from "@angular/forms";
import { KeycloakService } from 'keycloak-angular';

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "../../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "../i18n/en";
import { locale as spanish } from "../i18n/es";

//////////// ANGULAR MATERIAL ///////////
import {
  MatSnackBar
} from '@angular/material';

////////// RXJS ///////////
// tslint:disable-next-line:import-blacklist
import * as Rx from "rxjs/Rx";
import { map, mergeMap, toArray } from "rxjs/operators";

@Component({
  // tslint:disable-next-line:component-selector
  selector: 'acss',
  templateUrl: './acss-detail.component.html',
  styleUrls: ['./acss-detail.component.scss']
})
export class ACSSDetailComponent implements OnInit, OnDestroy {
  userRoles: any;
  isSystemAdmin: Boolean = false;
  // Rxjs subscriptions
  subscriptions = [];
  businessForm: FormGroup;
  businessQuery$: Rx.Observable<any>;
  selectedBusiness: any = null;
  selectedClearing = null; 

  constructor(
    private formBuilder: FormBuilder,
    private aCSSDetailService: ACSSDetailService,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
    private snackBar: MatSnackBar,
    private keycloakService: KeycloakService,
    private router: Router,
    private activatedRouter: ActivatedRoute
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }


  ngOnInit() {
    this.checkIfUserIsSystemAdmin();
    this.businessForm = this.createBusinessForm();
    this.findClearing();
  }

  findClearing() {
    this.subscriptions.push(this.activatedRouter.params
      .pipe(
        mergeMap(params => this.aCSSDetailService.getClearingById$(params.id))
      )
      .subscribe(clearingData => {
        console.log('selectedClearing => ', clearingData);
        this.selectedClearing = clearingData.data.getClearingById;
      }));
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
  }

  /**
   * get the business which the user belongs
   */
  getBusiness$(){
    this.subscriptions.push(this.aCSSDetailService.getACSSBusiness$()
    .pipe(
      map((res: any) => res.data.getACSSBusiness)
    ).subscribe(business => {
      this.selectedBusiness = business;
    }));
  }

  /**
   * Creates an observable of business
   */
  createBusinessObservable(){
    this.businessQuery$ = this.aCSSDetailService.getACSSBusinesses$().pipe(
      mergeMap((res: any) => {
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


  ngOnDestroy() {
    if (this.subscriptions) {
      this.subscriptions.forEach(sub => {
        sub.unsubscribe();
      });
    }
  }

}
