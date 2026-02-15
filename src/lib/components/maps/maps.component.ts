import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import {
  GoogleMapsModule,
  MapInfoWindow,
  MapMarker,
} from '@angular/google-maps';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { ClickNCollectService } from '../../services/click-n-collect.service';
import { Store } from '../../types/store.type';
import { CartProduct } from '../../types/cart.type';

@Component({
  selector: 'cnc-maps',
  standalone: true,
  imports: [GoogleMapsModule, MatButtonModule, MatIconModule],
  templateUrl: './maps.component.html',
  styleUrl: './maps.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsComponent {
  private readonly cncService = inject(ClickNCollectService);
  private readonly dialog = inject(MatDialog);

  readonly infoWindow = viewChild<MapInfoWindow>('infoWindow');

  readonly mapHeight = input<number>(450);
  readonly mapWidth = input<number>(
    typeof screen !== 'undefined' ? screen.width : 400,
  );
  readonly modelNo = input<string>('');
  readonly size = input<number>(0);
  readonly variantId = input<string>('');
  readonly cartProducts = input<CartProduct[]>([]);

  private readonly filteredData = computed(() => {
    const s = this.size();
    if (s > 0) {
      return this.cncService.filterByProductAvailability(
        this.modelNo(),
        s,
        this.variantId(),
      );
    }
    if (this.cartProducts().length > 0) {
      return this.cncService.filterByCartAvailability(this.cartProducts());
    }
    return {
      stores: this.cncService.stores(),
      locations: this.cncService.markerPositions(),
    };
  });

  readonly storeList = computed(() => this.filteredData().stores);
  readonly storeLocations = computed(() => this.filteredData().locations);
  readonly directionsResult = computed(() =>
    this.cncService.directionsResult(),
  );

  readonly isStoreSelected = signal(false);
  readonly currentStore = signal<Store | null>(null);

  readonly mapStyles: google.maps.MapTypeStyle[] = [
    {
      featureType: 'administrative',
      elementType: 'all',
      stylers: [{ visibility: 'simplified' }],
    },
    {
      featureType: 'landscape',
      elementType: 'geometry',
      stylers: [{ visibility: 'simplified' }, { color: '#fcfcfc' }],
    },
    {
      featureType: 'poi',
      elementType: 'geometry',
      stylers: [{ visibility: 'simplified' }, { color: '#fcfcfc' }],
    },
    {
      featureType: 'road.highway',
      elementType: 'geometry',
      stylers: [{ visibility: 'simplified' }, { color: '#dddddd' }],
    },
    {
      featureType: 'road.arterial',
      elementType: 'geometry',
      stylers: [{ visibility: 'simplified' }, { color: '#dddddd' }],
    },
    {
      featureType: 'road.local',
      elementType: 'geometry',
      stylers: [{ visibility: 'simplified' }, { color: '#eeeeee' }],
    },
    {
      featureType: 'water',
      elementType: 'geometry',
      stylers: [{ visibility: 'simplified' }, { color: '#dddddd' }],
    },
  ];

  readonly markerOptions: google.maps.MarkerOptions = {
    draggable: false,
    animation: google.maps.Animation.DROP,
  };

  // ── Derived from service (no hardcoded coords) ─────────────────
  readonly currentLocation = computed(() => this.cncService.currentLocation());

  readonly options = computed<google.maps.MapOptions>(() => {
    const loc = this.currentLocation();
    return {
      ...(loc ? { center: loc } : {}),
      zoom: 8,
      styles: this.mapStyles,
    };
  });

  onGetCurrentLocation(): void {
    this.cncService.getCurrentLocation();
  }

  onGetDirections(location: { lat: number; lng: number }): void {
    this.cncService.getDirections(location);
  }

  openInfoWindow(
    marker: MapMarker,
    store: Store,
    event: google.maps.MapMouseEvent,
  ): void {
    this.currentStore.set(store);
    this.infoWindow()?.open(marker);
  }

  onStoreSelect(store: Store): void {
    this.cncService.selectStore(store);
    this.infoWindow()?.close();
    this.dialog.closeAll();
    this.isStoreSelected.set(true);
  }

  reselectStore(): void {
    this.isStoreSelected.set(false);
  }
}
