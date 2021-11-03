import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SizeSelectorComponent } from './size-selector.component';
import { MaterialModule } from '../shared/modules/material.module';
import { BrowserModule } from '@angular/platform-browser';
import { FlexLayoutModule } from '@angular/flex-layout';



@NgModule({
  declarations: [SizeSelectorComponent],
  imports: [
    CommonModule,
    MaterialModule,
    FlexLayoutModule,
    BrowserModule
  ],
  exports: [SizeSelectorComponent]
})
export class SizeSelectorModule { }
