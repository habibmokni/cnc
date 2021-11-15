import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ProductAvailabilityComponent } from './productAvailability.component';
import { MapsModule } from '../maps/maps.module';
import { BrowserModule, By } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { ClickNCollectService } from '../clickNCollect.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from '../shared/modules/material.module';


describe('ProductAvailabilityComponent', () => {
  let component: ProductAvailabilityComponent;
  let fixture: ComponentFixture<ProductAvailabilityComponent>;
  let service: ClickNCollectService;
  let dialog: MatDialog;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProductAvailabilityComponent ],
      imports: [
        MaterialModule,
        BrowserModule,
        CommonModule,
        BrowserAnimationsModule,
        FlexLayoutModule,
        GoogleMapsModule,
        MapsModule
      ],
      providers: [{
        provide: MAT_DIALOG_DATA, useValue: {
          data: 'checkout'
        }
      }]
    })
    .compileComponents();
    service = TestBed.inject(ClickNCollectService);
    dialog = TestBed.inject(MatDialog);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProductAvailabilityComponent);
    component = fixture.componentInstance;
    component.stores = service.getStoreList();
    component.cartProducts = service.getCartProducts();
    component.sizeAndModel = {
      size: 41, modelNo: '#590F34'
    };
    component.user = service.getUser();
    service.distanceInKm.push(41.5656565656, 42.454578785);
    fixture.detectChanges();
  });

  it('should check selected product availability', ()=> {
    component.checkProductAvailabilty('22224488', 42, '#590F34');
    fixture.detectChanges();
    console.log(component.nearByStores);
    expect(component.nearByStores).not.toBe([]);
  });

  it('should check all cartProducts availability', ()=>{
    component.checkAllProductsAvailability(component.cartProducts);
    fixture.detectChanges();
    expect(component.nearByStores).not.toBe([]);
  });

  it('should run onStoreSelect on button click', fakeAsync(()=>{
    component.checkAllProductsAvailability(component.cartProducts);
    spyOn(component, 'onStoreSelect');
    spyOn(component.selectedStore, 'emit');
    spyOn(dialog, 'closeAll');
    fixture.detectChanges();
    let button = fixture.debugElement.query(By.css('mat-card-content'));
    button.triggerEventHandler('click', null);
    tick();
    fixture.detectChanges();
    expect(component.onStoreSelect).toHaveBeenCalled();
    expect(component.selectedStore.emit).toBeTruthy();
    expect(dialog.closeAll).toBeTruthy();
  }));

  it('should run on component create', fakeAsync(() => {
    spyOn(component, 'ngOnInit');
    fixture.detectChanges();
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.ngOnInit).toHaveBeenCalled();
  }));
});
