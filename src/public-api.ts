/*
 * Public API Surface of @habibmokni/cnc v2
 */

// Models
export * from './lib/models/index';

// Service
export { ClickNCollectService } from './lib/clickNCollect.service';

// Standalone components
export { ClickNCollectComponent } from './lib/clickNCollect.component';
export { StoreSelectorComponent } from './lib/store-selector/store-selector.component';
export { SizeSelectorComponent } from './lib/sizeSelector/sizeSelector.component';
export { ProductAvailabilityComponent } from './lib/productAvailability/productAvailability.component';
export { CheckAvailabilityComponent } from './lib/checkAvailability/checkAvailability.component';
export { MapsComponent } from './lib/maps/maps.component';

// Backward-compatible barrel module
export { ClickNCollectModule } from './lib/clickNCollect.module';
