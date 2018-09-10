//////////// ANGULAR MATERIAL ///////////
import {
  MatTableDataSource,
} from '@angular/material';

////////// ANGULAR //////////
import { Component, OnInit, OnDestroy } from "@angular/core";
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

  // Incomes Table data
  incomesDataSource = new MatTableDataSource();

  // Outcomes Table data
  outcomesDataSource = new MatTableDataSource();

  // Partial settlement - Incomes Table data
  partialSettlementIncomesDataSource = new MatTableDataSource();

  // Partial settlement - Outcomes Table data
  partialSettlementOutcomesDataSource = new MatTableDataSource();

  // Columns to show in the table
  displayedColumns = ['businessName', 'value'];

  clearing: Clearing;

  clearingForm = null;

  constructor(private formBuilder: FormBuilder,
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService,
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
    this.clearing = new Clearing();
    this.clearing.timestamp = new Date().getMilliseconds();
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
    this.createClearingForm();
  }

  createClearingForm(){
    this.clearingForm = this.formBuilder.group({
      date: [
        this.clearing.timestamp
      ],
      open: [
        this.clearing.open
      ],
    });
  }

}
