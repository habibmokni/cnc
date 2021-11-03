import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CheckAvailabilityComponent } from './check-availability.component';

describe('CheckAvailabilityComponent', () => {
  let component: CheckAvailabilityComponent;
  let fixture: ComponentFixture<CheckAvailabilityComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CheckAvailabilityComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckAvailabilityComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
