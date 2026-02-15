import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
  NgZone,
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ClickNCollectService } from '../../services/click-n-collect.service';
import { MapsComponent } from '../maps/maps.component';
import { CncStore, CncNearbyStore } from '../../types/store.type';
import { ProductAvailabilityDialogData } from '../../types/dialog.type';

@Component({
  selector: 'cnc-product-availability',
  standalone: true,
  imports: [
    MatDialogModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatDividerModule,
    MatFormFieldModule,
    MapsComponent,
  ],
  templateUrl: './product-availability.component.html',
  styleUrl: './product-availability.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductAvailabilityComponent {
  private readonly ngZone = inject(NgZone);
  private readonly cncService = inject(ClickNCollectService);
  private readonly dialog = inject(MatDialog);
  protected readonly data: ProductAvailabilityDialogData =
    inject(MAT_DIALOG_DATA);

  private readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');

  protected readonly stores = computed(() => this.cncService.stores());
  protected readonly cartProducts = computed(
    () => this.cncService.cartProducts(),
  );

  protected readonly nearbyStores = signal<CncNearbyStore[]>([]);

  constructor() {
    effect((onCleanup) => {
      const el = this.searchInput()?.nativeElement;
      if (!el) return;

      const autocomplete = new google.maps.places.Autocomplete(el);
      const listener = autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          this.nearbyStores.set([]);
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          this.cncService.findClosestMarker(lat, lng);

          if (
            this.data.call === 'product' ||
            this.data.call === 'size-selector'
          ) {
            this.nearbyStores.set(
              this.cncService.checkProductAvailability(
                this.data.modelNo ?? '',
                this.data.size ?? 0,
                this.data.variantId ?? '',
              ),
            );
          }

          if (this.data.call === 'checkout') {
            this.nearbyStores.set(
              this.cncService.checkAllProductsAvailability(
                this.cartProducts(),
              ),
            );
          }
        });
      });

      onCleanup(() => google.maps.event.removeListener(listener));
    });
  }

  protected onStoreSelect(store: CncStore): void {
    this.cncService.selectStore(store);
    this.dialog.closeAll();
  }
}
