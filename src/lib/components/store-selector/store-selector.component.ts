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
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ClickNCollectService } from '../../services/click-n-collect.service';
import { MapsComponent } from '../maps/maps.component';
import { Store, NearbyStore } from '../../types/store.type';

@Component({
  selector: 'cnc-store-selector',
  standalone: true,
  imports: [
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
export class StoreSelectorComponent {
  private readonly cncService = inject(ClickNCollectService);
  private readonly ngZone = inject(NgZone);

  // ── viewChild for autocomplete (replaces document.getElementById) ─
  readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // ── Derived from service ───────────────────────────────────────
  readonly user = computed(() => this.cncService.user());
  readonly stores = computed(() => this.cncService.stores());

  // ── Local state ────────────────────────────────────────────────
  readonly nearbyStores = signal<NearbyStore[]>([]);
  readonly isStores = signal(false);

  constructor() {
    // Set up Google Places Autocomplete when the input element appears
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
          this.nearbyStores.set(this.cncService.nearbyStores());
          this.isStores.set(true);
        });
      });

      onCleanup(() => google.maps.event.removeListener(listener));
    });
  }

  // ── Actions ────────────────────────────────────────────────────
  onStoreSelect(store: Store): void {
    this.cncService.selectStore(store);
    this.nearbyStores.set([]);
  }
}
