import { NgModule } from '@angular/core';
import { ClickNCollectComponent } from '../components/click-n-collect/click-n-collect.component';
import { StoreSelectorComponent } from '../components/store-selector/store-selector.component';
import { SizeSelectorComponent } from '../components/size-selector/size-selector.component';
import { ProductAvailabilityComponent } from '../components/product-availability/product-availability.component';
import { CheckAvailabilityComponent } from '../components/check-availability/check-availability.component';
import { MapsComponent } from '../components/maps/maps.component';

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
