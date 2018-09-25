import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AcssErrorsComponent } from './acss-errors.component';

describe('AcssErrorsComponent', () => {
  let component: AcssErrorsComponent;
  let fixture: ComponentFixture<AcssErrorsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AcssErrorsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcssErrorsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
