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

  // ── Inputs ─────────────────────────────────────────────────────
  readonly mapHeight = input<number>(450);
  readonly mapWidth = input<number>(
    typeof screen !== 'undefined' ? screen.width : 400,
  );
  readonly modelNo = input<string>('');
  readonly size = input<number>(0);
  readonly variantId = input<string>('');
  readonly cartProducts = input<CartProduct[]>([]);

  // ── Derived from service + inputs ──────────────────────────────
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

  // ── Local state ────────────────────────────────────────────────
  readonly isStoreSelected = signal(false);
  readonly currentStore = signal<Store | null>(null);

  readonly currentUserLocation = signal<google.maps.LatLngLiteral>({
    lat: 31.4914,
    lng: 74.2385,
  });

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

  readonly options = signal<google.maps.MapOptions>({
    center: { lat: 51.44157584725519, lng: 7.565725496333208 },
    zoom: 8,
    styles: this.mapStyles,
  });

  readonly markerOptions: google.maps.MarkerOptions = {
    draggable: false,
    animation: google.maps.Animation.DROP,
  };

  readonly currentLocation = signal<google.maps.LatLngLiteral>({
    lat: 51.44157584725519,
    lng: 7.565725496333208,
  });

  // ── Actions ────────────────────────────────────────────────────
  onGetCurrentLocation(): void {
    this.cncService.getCurrentLocation();
    // Reactively read the updated location after geolocation resolves
    const check = setInterval(() => {
      const loc = this.cncService.currentLocation();
      if (loc.lat !== 51.44157584725519 || loc.lng !== 7.565725496333208) {
        this.options.set({ ...this.options(), center: loc });
        this.currentUserLocation.set(loc);
        clearInterval(check);
      }
    }, 200);
    // Safety: clear after 5s
    setTimeout(() => clearInterval(check), 5000);
  }

  onGetDirections(location: { lat: number; lng: number }): void {
    this.cncService.getDirections(location);
    this.options.update((o) => ({ ...o, zoom: 2 }));
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
