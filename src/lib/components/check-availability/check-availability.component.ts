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
import { CncNearbyStore } from '../../types/store.type';
import { CheckAvailabilityDialogData } from '../../types/dialog.type';

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
  protected readonly data: CheckAvailabilityDialogData =
    inject(MAT_DIALOG_DATA);

  private readonly searchInput =
    viewChild<ElementRef<HTMLInputElement>>('searchInput');

  // ── Local state ────────────────────────────────────────────────
  protected readonly nearbyStores = signal<CncNearbyStore[]>([]);
  protected readonly size = signal(0);
  protected readonly isSizeSelected = signal(false);

  private readonly geoRequested = signal(false);

  constructor() {
    if (this.data.size) {
      this.size.set(this.data.size);
      this.isSizeSelected.set(true);
    }

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

    // React to geolocation resolving after user clicks "use my location"
    effect(() => {
      const loc = this.cncService.currentLocation();
      if (!loc || !this.geoRequested()) return;
      this.nearbyStores.set([]);
      this.cncService.findClosestMarker(loc.lat, loc.lng);
      this.nearbyStores.set(
        this.cncService.checkProductAvailability(
          this.data.modelNo,
          this.size(),
          this.data.variantId,
        ),
      );
      this.geoRequested.set(false);
    });
  }

  protected changeSize(newSize: number): void {
    this.nearbyStores.set([]);
    this.size.set(newSize);
    this.isSizeSelected.set(true);
  }

  protected currentLocation(): void {
    this.geoRequested.set(true);
    this.cncService.getCurrentLocation();
  }
}
