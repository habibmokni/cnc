import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClickNCollectComponent } from './click-n-collect.component';

describe('ClickNCollectComponent', () => {
  let component: ClickNCollectComponent;
  let fixture: ComponentFixture<ClickNCollectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClickNCollectComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClickNCollectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
