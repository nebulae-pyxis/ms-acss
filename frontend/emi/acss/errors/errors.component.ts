import { Component, OnInit } from '@angular/core';

//////////// i18n ////////////
import { FuseTranslationLoaderService } from "../../../../core/services/translation-loader.service";
import { TranslateService } from "@ngx-translate/core";
import { locale as english } from "../i18n/en";
import { locale as spanish } from "../i18n/es";

@Component({
  selector: 'app-errors',
  templateUrl: './errors.component.html',
  styleUrls: ['./errors.component.scss']
})
export class ErrorsComponent implements OnInit {

  constructor(
    private translationLoader: FuseTranslationLoaderService,
    private translate: TranslateService
  ) {
    this.translationLoader.loadTranslations(english, spanish);
  }

  ngOnInit() {
  }

}
