import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MaterialModule } from '../shared/modules/material.module';
import { MapsComponent } from '../maps/maps.component';
import { GoogleMapsModule } from '@angular/google-maps';
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from '@angular/flex-layout';



@NgModule({
  declarations: [MapsComponent],
  imports: [
    CommonModule,
    MaterialModule,
    BrowserModule,
    FlexLayoutModule,
    GoogleMapsModule
  ],
  exports: [MapsComponent]
})
export class MapsModule { }
