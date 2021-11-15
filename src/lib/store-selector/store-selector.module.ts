import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { StoreSelectorComponent } from './store-selector.component';
import { MaterialModule } from '../shared/modules/material.module';
import { BrowserModule } from '@angular/platform-browser';
import { MapsModule } from '../maps/maps.module';
import { FlexLayoutModule } from '@angular/flex-layout';



@NgModule({
  declarations: [StoreSelectorComponent],
  imports: [
    CommonModule,
    MaterialModule,
    BrowserModule,
    FlexLayoutModule,
    MapsModule
  ],
  exports: [StoreSelectorComponent]
})
export class StoreSelectorModule { }
