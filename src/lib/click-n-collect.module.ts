import { NgModule } from '@angular/core';
import { FlexLayoutModule } from '@angular/flex-layout';
import { GoogleMapsModule } from '@angular/google-maps';
import { BrowserModule } from '@angular/platform-browser';
import { CheckAvailabilityModule } from './check-availability/check-availability.module';
import { ClickNCollectComponent } from './click-n-collect.component';
import { MapsModule } from './maps/maps.module';
import { MaterialModule } from './shared/modules/material.module';
import { SizeSelectorModule } from './size-selector/size-selector.module';
import { StoreAvailabilityModule } from './store-availability/store-availability.module';
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
    StoreAvailabilityModule,
    SizeSelectorModule,
    StoreSelectorModule,
    CheckAvailabilityModule
  ],
  exports: [
    SizeSelectorModule,
    ClickNCollectComponent,
    StoreSelectorModule,
    StoreAvailabilityModule,
    CheckAvailabilityModule
  ]
})
export class ClickNCollectModule { }
