import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { GoogleMapsModule } from '@angular/google-maps';
import { BrowserModule } from '@angular/platform-browser';
import { CheckAvailabilityModule } from './checkAvailability/checkAvailability.module';
import { ClickNCollectComponent } from './clickNCollect.component';
import { MapsModule } from './maps/maps.module';
import { MaterialModule } from './shared/modules/material.module';
import { SizeSelectorModule } from './sizeSelector/sizeSelector.module';
import { ProductAvailabilityModule } from './productAvailability/productAvailability.module';
import { StoreSelectorModule } from './store-selector/store-selector.module';


@NgModule({
  declarations: [
    ClickNCollectComponent
  ],
  imports: [
    BrowserModule,
    MaterialModule,
    FlexLayoutModule,
    GoogleMapsModule,
    MapsModule,
    ProductAvailabilityModule,
    SizeSelectorModule,
    StoreSelectorModule,
    CheckAvailabilityModule
  ],
  exports: [
    SizeSelectorModule,
    ClickNCollectComponent,
    StoreSelectorModule,
    ProductAvailabilityModule,
    CheckAvailabilityModule
  ]
})
export class ClickNCollectModule { }
