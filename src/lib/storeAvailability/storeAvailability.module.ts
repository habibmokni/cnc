import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../shared/modules/material.module';
import { BrowserModule } from '@angular/platform-browser';
import { StoreAvailabilityComponent } from './storeAvailability.component';
import { MapsModule } from '../maps/maps.module';
import { FlexLayoutModule } from '@angular/flex-layout';



@NgModule({
  declarations: [StoreAvailabilityComponent],
  imports: [
    CommonModule,
    MaterialModule,
    BrowserModule,
    FlexLayoutModule,
    MapsModule
  ],
  exports: [StoreAvailabilityComponent]
})
export class StoreAvailabilityModule { }
