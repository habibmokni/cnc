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
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ClickNCollectService } from '../../services/click-n-collect.service';
import { MapsComponent } from '../maps/maps.component';
import { NearbyStore } from '../../types/store.type';

@Component({
  selector: 'cnc-check-availability',
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
  templateUrl: './check-availability.component.html',
  styleUrl: './check-availability.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckAvailabilityComponent {
  private readonly ngZone = inject(NgZone);
  private readonly cncService = inject(ClickNCollectService);
  readonly data: any = inject(MAT_DIALOG_DATA);

  // ── viewChild for autocomplete (replaces document.getElementById) ─
  readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // ── Derived from service ───────────────────────────────────────
  readonly stores = computed(() => this.cncService.stores());

  // ── Local state ────────────────────────────────────────────────
  readonly nearbyStores = signal<NearbyStore[]>([]);
  readonly size = signal(0);
  readonly isSizeSelected = signal(false);

  constructor() {
    // Initialise from dialog data
    if (this.data.size) {
      this.size.set(this.data.size);
      this.isSizeSelected.set(true);
    }

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
          this.nearbyStores.set(
            this.cncService.checkProductAvailability(
              this.data.modelNo,
              this.size(),
              this.data.variantId,
            ),
          );
        });
      });

      onCleanup(() => google.maps.event.removeListener(listener));
    });
  }

  // ── Actions ────────────────────────────────────────────────────
  changeSize(newSize: number): void {
    this.nearbyStores.set([]);
    this.size.set(newSize);
    this.isSizeSelected.set(true);
  }

  currentLocation(): void {
    this.cncService.getCurrentLocation();
    // After geolocation resolves, compute availability
    const check = setInterval(() => {
      const loc = this.cncService.currentLocation();
      if (loc.lat !== 51.44157584725519 || loc.lng !== 7.565725496333208) {
        this.nearbyStores.set([]);
        this.nearbyStores.set(
          this.cncService.checkProductAvailability(
            this.data.modelNo,
            this.size(),
            this.data.variantId,
          ),
        );
        clearInterval(check);
      }
    }, 200);
    setTimeout(() => clearInterval(check), 5000);
  }
}
