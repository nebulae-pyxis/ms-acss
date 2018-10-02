import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SettlementErrorsComponent } from './settlement-errors.component';

describe('SettlementErrorsComponent', () => {
  let component: SettlementErrorsComponent;
  let fixture: ComponentFixture<SettlementErrorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SettlementErrorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SettlementErrorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
