import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FlexLayoutModule } from '@angular/flex-layout';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MapsModule } from './../maps/maps.module';
import { ClickNCollectService } from '../clickNCollect.service';

import { CheckAvailabilityComponent } from './checkAvailability.component';
import { MaterialModule } from '../shared/modules/material.module';

describe('CheckAvailabilityComponent', () => {
  let component: CheckAvailabilityComponent;
  let fixture: ComponentFixture<CheckAvailabilityComponent>;
  let service: ClickNCollectService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CheckAvailabilityComponent ],
      imports: [
        MaterialModule,
        GoogleMapsModule,
        MapsModule,
        BrowserModule,
        CommonModule,
        BrowserAnimationsModule,
        FlexLayoutModule
      ],
      providers: [{
        provide: MAT_DIALOG_DATA, useValue: 'availabilty'
      }]
    })
    .compileComponents();
    service = TestBed.inject(ClickNCollectService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CheckAvailabilityComponent);
    component = fixture.componentInstance;
    component.cartProducts = service.stores[0].products;
    component.stores = service.getStoreList();
    service.distanceInKm.push(415.555888777999, 45588.8878787878787, 66969.3232323232);
    fixture.detectChanges();
  });

  it('should check selected product availability', ()=> {
    component.checkProductAvailabilty('22224488', 42, '#590F34');
    fixture.detectChanges();
    console.log(component.nearByStores);
    expect(component.nearByStores).not.toBe([]);
  });

  it('should check all cartProducts availability', ()=>{
    component.checkAllProductsAvailabilty(component.cartProducts);
    fixture.detectChanges();
    expect(component.nearByStores).not.toBe([]);
  });

  it('should run on component create', fakeAsync(() => {
    spyOn(component, 'ngOnInit');
    fixture.detectChanges();
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.ngOnInit).toHaveBeenCalled();
  }));
});
