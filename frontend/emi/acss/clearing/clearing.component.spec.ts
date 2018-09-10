import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ClearingComponent } from './clearing.component';

describe('ClearingComponent', () => {
  let component: ClearingComponent;
  let fixture: ComponentFixture<ClearingComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ClearingComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ClearingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
