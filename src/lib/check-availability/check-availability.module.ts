import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CheckAvailabilityComponent } from './check-availability.component';
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from '@angular/flex-layout';
import { MapsModule } from '../maps/maps.module';
import { MaterialModule } from '../shared/modules/material.module';



@NgModule({
  declarations: [CheckAvailabilityComponent],
  imports: [
    CommonModule,
    MaterialModule,
    BrowserModule,
    FlexLayoutModule,
    MapsModule
  ],
  exports: [CheckAvailabilityComponent]
})
export class CheckAvailabilityModule { }
