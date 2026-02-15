import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  OnInit,
  NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
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
import { CncUser } from '../models/user.model';

@Component({
  selector: 'cnc-store-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatDividerModule,
    MatFormFieldModule,
    MapsComponent,
  ],
  templateUrl: './store-selector.component.html',
  styleUrl: './store-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreSelectorComponent implements OnInit {
  private readonly cncService = inject(ClickNCollectService);
  private readonly ngZone = inject(NgZone);

  readonly user = signal<CncUser | null>(null);
  readonly stores = signal<Store[]>([]);
  readonly nearbyStores = signal<NearbyStore[]>([]);
  readonly isStores = signal(false);

  ngOnInit(): void {
    this.user.set(this.cncService.user());
    this.stores.set(this.cncService.stores());

    this.cncService.storeSelected.subscribe((store) => {
      const u = this.user();
      if (u) {
        this.cncService.setUser({ ...u, storeSelected: store });
        this.user.set(this.cncService.user());
      } else {
        this.cncService.setUser({ name: 'Anonymous', storeSelected: store } as any);
        this.user.set(this.cncService.user());
      }
    });

    setTimeout(() => {
      const input = document.getElementById('cnc-search-address') as HTMLInputElement;
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
          this.computeNearbyStores();
        });
      });
    }, 1000);
  }

  private computeNearbyStores(): void {
    const distances = this.cncService.distanceInKm();
    const result: NearbyStore[] = this.stores().map((store, i) => ({
      store,
      distance: distances[i] ?? Infinity,
    }));
    result.sort((a, b) => a.distance - b.distance);
    this.nearbyStores.set(result);
    this.isStores.set(true);
  }

  onStoreSelect(store: Store): void {
    this.cncService.storeSelected.next(store);
    this.nearbyStores.set([]);
  }
}
