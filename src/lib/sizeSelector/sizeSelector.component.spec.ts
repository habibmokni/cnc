import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FlexLayoutModule } from '@angular/flex-layout';
import { GoogleMapsModule } from '@angular/google-maps';
import { MatCardModule } from '@angular/material/card';
import { MatDialogModule } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { BrowserModule, By } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ClickNCollectService } from '../clickNCollect.service';
import { MapsModule } from '../maps/maps.module';
import { MaterialModule } from '../shared/modules/material.module';

import { SizeSelectorComponent } from './sizeSelector.component';

describe('SizeSelectedComponent', () => {
  let component: SizeSelectorComponent;
  let fixture: ComponentFixture<SizeSelectorComponent>;
  let service: ClickNCollectService;
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ SizeSelectorComponent ],
      imports: [
        MaterialModule,
        GoogleMapsModule,
        MapsModule,
        BrowserModule,
        CommonModule,
        BrowserAnimationsModule,
        FlexLayoutModule
      ],
      providers: []
    })
    .compileComponents();
    service = TestBed.inject(ClickNCollectService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SizeSelectorComponent);
    component = fixture.componentInstance;
    component.product = service.stores[0].products[0];
    component.user = service.getUser();
    service.distanceInKm.push(41.5877545, 42.888887777775, 45.355588885);
    fixture.detectChanges();
  });

  it('should call onSizeSelect on button click', fakeAsync(() => {
    spyOn(component, 'onSizeSelect');
    fixture.detectChanges();
    let button = fixture.debugElement.query(By.css('#sizeSelector'));
    button.triggerEventHandler('click', null);
    tick();
    fixture.detectChanges();
    expect(component.onSizeSelect).toHaveBeenCalled();
  }));

  it('should check if item is available in stock and open productAvailability if not', ()=> {
    component.onSizeSelect(41,0,component.product);
    spyOn(component, 'openDialog')
    fixture.detectChanges();
    expect(component.stock).toBeGreaterThanOrEqual(0);
    component.sizeSelected.subscribe(size=>{
      expect(size).toBe(41);
    });
    if(component.stock === 0 && component.product.variants[0].inStock[0]===0){
      component.openDialog(component.product);
      expect(component.openDialog).toHaveBeenCalled();
    }
  });

  it('should call openDailog on change store button click', fakeAsync(() => {
    component.isSizeSelected = true;
    spyOn(component, 'openDialog');
    fixture.detectChanges();
    let button = fixture.debugElement.query(By.css('#changeStore'));
    button.triggerEventHandler('click', null);
    tick();
    fixture.detectChanges();
    expect(component.openDialog).toHaveBeenCalled();
  }));

});
