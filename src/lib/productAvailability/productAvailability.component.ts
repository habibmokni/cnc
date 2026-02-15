import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ClickNCollectService } from '../clickNCollect.service';
import { MapsComponent } from '../maps/maps.component';
import { Store, NearbyStore } from '../models/store.model';
import { CartProduct } from '../models/cart.model';

@Component({
  selector: 'cnc-product-availability',
  standalone: true,
  imports: [
    CommonModule,
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
  templateUrl: './productAvailability.component.html',
  styleUrl: './productAvailability.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductAvailabilityComponent implements OnInit {
  private readonly ngZone = inject(NgZone);
  private readonly cncService = inject(ClickNCollectService);
  private readonly dialog = inject(MatDialog);
  readonly data: any = inject(MAT_DIALOG_DATA);

  readonly stores = signal<Store[]>(this.cncService.stores());
  readonly cartProducts = signal<CartProduct[]>(this.cncService.cartProducts());
  readonly nearbyStores = signal<NearbyStore[]>([]);

  ngOnInit(): void {
    setTimeout(() => {
      const input = document.getElementById('cnc-search-availability') as HTMLInputElement;
      if (!input) return;

      const autocomplete = new google.maps.places.Autocomplete(input);
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          this.nearbyStores.set([]);
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          if (this.data.call === 'product' || this.data.call === 'size-selector') {
            this.cncService.findClosestMarker(lat, lng);
            setTimeout(() => {
              this.checkProductAvailability(
                this.data.modelNo,
                this.data.size,
                this.data.variantId,
              );
            }, 500);
          }

          if (this.data.call === 'checkout') {
            this.cncService.findClosestMarker(lat, lng);
            setTimeout(() => {
              this.checkAllProductsAvailability(this.cartProducts());
            }, 500);
          }
        });
      });
    }, 1000);
  }

  onStoreSelect(store: Store): void {
    const user = this.cncService.user();
    if (user) {
      this.cncService.setUser({ ...user, storeSelected: store });
    } else {
      this.cncService.setUser({ name: 'Anonymous', storeSelected: store } as any);
    }
    this.cncService.storeSelected.next(store);
    this.dialog.closeAll();
  }

  private checkProductAvailability(modelNo: string, productSize: number, variantId: string): void {
    const results: NearbyStore[] = [];
    const distances = this.cncService.distanceInKm();

    this.stores().forEach((store, i) => {
      for (const product of store.products) {
        if (product.modelNo !== modelNo) continue;
        for (const variant of product.variants) {
          if (variant.variantId !== variantId) continue;
          for (let j = 0; j < variant.sizes.length; j++) {
            if (+variant.sizes[j] === +productSize) {
              results.push({
                store,
                stock: +variant.instock[j],
                distance: distances[i] ?? Infinity,
              });
            }
          }
        }
      }
    });

    results.sort((a, b) => a.distance - b.distance);
    this.nearbyStores.set(results);
  }

  private checkAllProductsAvailability(cart: CartProduct[]): void {
    const results: NearbyStore[] = [];
    const distances = this.cncService.distanceInKm();

    this.stores().forEach((store, i) => {
      let isAvailable = 10;
      for (const product of store.products) {
        for (const cp of cart) {
          if (product.modelNo !== cp.modelNo || isAvailable <= 0) continue;
          for (const variant of product.variants) {
            if (variant.variantId !== cp.variantId) continue;
            for (let j = 0; j < variant.sizes.length; j++) {
              if (+variant.sizes[j] === cp.size) {
                isAvailable = +variant.instock[j] >= cp.noOfItems ? 10 : 0;
              }
            }
          }
        }
      }
      results.push({ store, stock: isAvailable, distance: distances[i] ?? Infinity });
    });

    results.sort((a, b) => a.distance - b.distance);
    this.nearbyStores.set(results);
  }
}
