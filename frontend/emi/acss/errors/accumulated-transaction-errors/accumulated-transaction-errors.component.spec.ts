import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AccumulatedTransactionErrorsComponent } from './accumulated-transaction-errors.component';

describe('AccumulatedTransactionErrorsComponent', () => {
  let component: AccumulatedTransactionErrorsComponent;
  let fixture: ComponentFixture<AccumulatedTransactionErrorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AccumulatedTransactionErrorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AccumulatedTransactionErrorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
