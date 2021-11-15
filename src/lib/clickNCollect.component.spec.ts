import { CommonModule } from '@angular/common';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { FlexLayoutModule } from '@angular/flex-layout';
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
import { ClickNCollectComponent } from './clickNCollect.component';
import { ClickNCollectService } from './clickNCollect.service';
import { MaterialModule } from './shared/modules/material.module';

describe('ClickNCollectComponent', () => {
  let component: ClickNCollectComponent;
  let fixture: ComponentFixture<ClickNCollectComponent>;
  let service: ClickNCollectService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ClickNCollectComponent ],
      imports: [
        BrowserModule,
        CommonModule,
        BrowserAnimationsModule,
        MaterialModule,
        FlexLayoutModule
      ],
      providers: [ClickNCollectService]
    })
    .compileComponents();
    service = TestBed.inject(ClickNCollectService);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ClickNCollectComponent);
    fixture.detectChanges();
    component = fixture.componentInstance;
    component.user = service.getUser();
    component.cartProducts = service.getCartProducts();
    component.cartItemUnavailable = service.getCartProducts();
    component.allItemsAvailable = false;
    fixture.detectChanges();
  });

  it('onDaySelect should be called when date selected', fakeAsync (() => {
    component.user = service.getUser();
    spyOn(component, 'onDaySelect');
    component.calender.push(new Date());
    fixture.detectChanges();
    let button = fixture.debugElement.query(By.css('.dateButton'));
    button.triggerEventHandler('click', Date);
    tick();
    fixture.detectChanges();
    expect(component.onDaySelect).toHaveBeenCalled();
  }));

  it('onTimeSelect should be called when time selected', fakeAsync (() => {
    spyOn(component, 'onTimeSelected');
    component.times.push(7);
    fixture.detectChanges();
    let button = fixture.debugElement.query(By.css('mat-radio-button'));
    button.triggerEventHandler('click', null);
    tick();
    fixture.detectChanges();
    expect(component.onTimeSelected).toHaveBeenCalled();
  }));

  it('removeProductsUnavailable should be called when click button', fakeAsync (() => {
    spyOn(component, 'removeProductsUnavailable');
    fixture.detectChanges();
    let button = fixture.debugElement.query(By.css('#removeButton'));
    button.triggerEventHandler('click', null);
    tick();
    fixture.detectChanges();
    expect(component.removeProductsUnavailable).toHaveBeenCalled();
  }));

  it('removeProductsUnavailable should remove unavailable items', fakeAsync (() => {
    spyOn(component.isAllItemsAvailable, 'emit');
    spyOn(component.productsToRemove, 'emit');
    fixture.detectChanges();
    let button = fixture.debugElement.query(By.css('#removeButton'));
    button.triggerEventHandler('click', null);
    tick();
    fixture.detectChanges();
    expect(component.isAllItemsAvailable.emit).toHaveBeenCalledWith(true);
    expect(component.productsToRemove.emit).toHaveBeenCalledWith(component.cartItemUnavailable);
  }));


  it('ngOnInIt should run without errors',() => {
    spyOn(component, 'ngOnInit');
    fixture.detectChanges();
    component.ngOnInit();
    fixture.detectChanges();
    expect(component.ngOnInit).toHaveBeenCalled();
    expect(component.stores).toBe(service.getStoreList());
    expect(component.storeLocations).toBe(service.getStoreLocations());
  });

  it('should check if products are available in stock or not',() => {
    spyOn(component, 'checkProductsStock');
    fixture.detectChanges();
    component.checkProductsStock();
    fixture.detectChanges();
    expect(component.checkProductsStock).toHaveBeenCalled();
    expect(component.itemInStock).toBeTruthy();
    expect(component.storeLocations).toBe(service.getStoreLocations());
  });

  it('should open productAvailability', fakeAsync(() => {
    spyOn(component, 'onOpenDialog');
    fixture.detectChanges();
    let button = fixture.debugElement.query(By.css('#openDialog'));
    button.triggerEventHandler('click', null);
    tick();
    fixture.detectChanges();
    expect(component.onOpenDialog).toHaveBeenCalled();
  }));

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
