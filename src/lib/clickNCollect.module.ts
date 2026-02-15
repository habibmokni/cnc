import { NgModule } from '@angular/core';
import { ClickNCollectComponent } from './clickNCollect.component';
import { StoreSelectorComponent } from './store-selector/store-selector.component';
import { SizeSelectorComponent } from './sizeSelector/sizeSelector.component';
import { ProductAvailabilityComponent } from './productAvailability/productAvailability.component';
import { CheckAvailabilityComponent } from './checkAvailability/checkAvailability.component';
import { MapsComponent } from './maps/maps.component';

/**
 * Barrel NgModule for backward compatibility.
 *
 * Consuming apps that still use `importProvidersFrom(ClickNCollectModule)`
 * can continue to do so. All components are standalone and can also be
 * imported individually.
 */
@NgModule({
  imports: [
    ClickNCollectComponent,
    StoreSelectorComponent,
    SizeSelectorComponent,
    ProductAvailabilityComponent,
    CheckAvailabilityComponent,
    MapsComponent,
  ],
  exports: [
    ClickNCollectComponent,
    StoreSelectorComponent,
    SizeSelectorComponent,
    ProductAvailabilityComponent,
    CheckAvailabilityComponent,
    MapsComponent,
  ],
})
export class ClickNCollectModule {}
