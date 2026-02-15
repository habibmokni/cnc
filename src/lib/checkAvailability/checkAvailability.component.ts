import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
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

@Component({
  selector: 'cnc-check-availability',
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
  templateUrl: './checkAvailability.component.html',
  styleUrl: './checkAvailability.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckAvailabilityComponent implements OnInit {
  private readonly ngZone = inject(NgZone);
  private readonly cncService = inject(ClickNCollectService);
  readonly data: any = inject(MAT_DIALOG_DATA);

  readonly stores = signal<Store[]>(this.cncService.stores());
  readonly nearbyStores = signal<NearbyStore[]>([]);
  readonly size = signal(0);
  readonly isSizeSelected = signal(false);

  ngOnInit(): void {
    if (this.data.size) {
      this.size.set(this.data.size);
      this.isSizeSelected.set(true);
    }

    setTimeout(() => {
      const input = document.getElementById('cnc-search-check') as HTMLInputElement;
      if (!input) return;

      const autocomplete = new google.maps.places.Autocomplete(input);
      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          this.nearbyStores.set([]);
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;

          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();
          this.cncService.findClosestMarker(lat, lng);
          setTimeout(() => {
            this.checkProductAvailability(this.data.modelNo, this.size(), this.data.variantId);
          }, 100);
        });
      });
    }, 500);
  }

  changeSize(newSize: number): void {
    this.nearbyStores.set([]);
    this.size.set(newSize);
    this.isSizeSelected.set(true);
  }

  currentLocation(): void {
    this.cncService.getCurrentLocation();
    setTimeout(() => {
      this.nearbyStores.set([]);
      this.checkProductAvailability(this.data.modelNo, this.size(), this.data.variantId);
    }, 1000);
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
}
