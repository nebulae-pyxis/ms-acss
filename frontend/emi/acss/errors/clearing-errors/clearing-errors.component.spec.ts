import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClearingErrorsComponent } from './clearing-errors.component';

describe('ClearingErrorsComponent', () => {
  let component: ClearingErrorsComponent;
  let fixture: ComponentFixture<ClearingErrorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClearingErrorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClearingErrorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
