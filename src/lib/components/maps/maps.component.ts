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
import { CncStore } from '../../types/store.type';
import { CncCartItem } from '../../types/cart.type';

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

  private readonly infoWindow = viewChild<MapInfoWindow>('infoWindow');

  // ── Inputs ─────────────────────────────────────────────────────
  public readonly mapHeight = input<number>(450);
  public readonly mapWidth = input<number>(
    typeof screen !== 'undefined' ? screen.width : 400,
  );
  public readonly modelNo = input<string>('');
  public readonly size = input<number>(0);
  public readonly variantId = input<string>('');
  public readonly cartProducts = input<CncCartItem[]>([]);

  // ── Derived from service + inputs ──────────────────────────────
  private readonly filteredData = computed(() => {
    const selectedSize = this.size();
    if (selectedSize > 0) {
      return this.cncService.filterByProductAvailability(
        this.modelNo(),
        selectedSize,
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

  protected readonly storeList = computed(() => this.filteredData().stores);
  protected readonly storeLocations = computed(
    () => this.filteredData().locations,
  );
  protected readonly directionsResult = computed(() =>
    this.cncService.directionsResult(),
  );

  // ── Local state ────────────────────────────────────────────────
  protected readonly isStoreSelected = signal(false);
  protected readonly currentStore = signal<CncStore | null>(null);

  protected readonly mapStyles: google.maps.MapTypeStyle[] = [
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

  protected readonly markerOptions: google.maps.MarkerOptions = {
    draggable: false,
    animation: google.maps.Animation.DROP,
  };

  protected readonly currentLocation = computed(() =>
    this.cncService.currentLocation(),
  );

  protected readonly options = computed<google.maps.MapOptions>(() => {
    const loc = this.currentLocation();
    return {
      ...(loc ? { center: loc } : {}),
      zoom: 8,
      styles: this.mapStyles,
    };
  });

  // ── Actions ────────────────────────────────────────────────────
  protected onGetCurrentLocation(): void {
    this.cncService.getCurrentLocation();
  }

  protected onGetDirections(location: { lat: number; lng: number }): void {
    this.cncService.getDirections(location);
  }

  protected openInfoWindow(
    marker: MapMarker,
    store: CncStore,
    event: google.maps.MapMouseEvent,
  ): void {
    this.currentStore.set(store);
    this.infoWindow()?.open(marker);
  }

  protected onStoreSelect(store: CncStore): void {
    this.cncService.selectStore(store);
    this.infoWindow()?.close();
    this.dialog.closeAll();
    this.isStoreSelected.set(true);
  }

  protected reselectStore(): void {
    this.isStoreSelected.set(false);
  }
}
