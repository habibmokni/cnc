import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FlexLayoutModule } from '@angular/flex-layout';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClickNCollectService } from '../clickNCollect.service';
import { MapsModule } from '../maps/maps.module';
import { MaterialModule } from '../shared/modules/material.module';

import { StoreSelectorComponent } from './store-selector.component';

describe('StoreSelectedComponent', () => {
  let component: StoreSelectorComponent;
  let fixture: ComponentFixture<StoreSelectorComponent>;
  let service: ClickNCollectService;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ StoreSelectorComponent ],
      imports: [
        MatDialogModule,
        GoogleMapsModule,
        MapsModule,
        BrowserModule,
        CommonModule,
        BrowserAnimationsModule,
        MaterialModule,
        FlexLayoutModule
      ],
      providers: []
    })
    .compileComponents();
    service = TestBed.inject(ClickNCollectService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(StoreSelectorComponent);
    component = fixture.componentInstance;
    component.stores = service.getStoreList();
    component.user = service.getUser();
    service.distanceInKm.push(41.5877545, 42.888887777775, 45.355588885);
    fixture.detectChanges();
  });

  it('should create a list of nearby stores', ()=> {
    component.storesNearBy();
    fixture.detectChanges();
    expect(component.nearByStores).not.toBe([]);
    expect(component.isStores).toBe(true);
  });

  it('should call onStoreSelect on button click', fakeAsync(() => {
    component.storesNearBy();
    spyOn(component, 'onStoreSelect');
    fixture.detectChanges();
    let button = fixture.debugElement.query(By.css('mat-card-content '));
    button.triggerEventHandler('click', null);
    tick();
    fixture.detectChanges();
    expect(component.onStoreSelect).toHaveBeenCalled();
  }));

  it('should emit selectedStore on onStoreSelect() method call', fakeAsync(() => {
    component.storesNearBy();
    spyOn(service.storeSelected, 'next');
    fixture.detectChanges();
    component.onStoreSelect(component.stores[0]);
    fixture.detectChanges();
    service.storeSelected.subscribe(store=>{
      expect(store).toBe(component.stores[0]);
    })
  }));
});
