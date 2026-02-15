import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  signal,
  viewChild,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Observable } from 'rxjs';
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
  imports: [CommonModule, GoogleMapsModule, MatButtonModule, MatIconModule],
  templateUrl: './maps.component.html',
  styleUrl: './maps.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapsComponent implements OnInit {
  private readonly cncService = inject(ClickNCollectService);
  private readonly dialog = inject(MatDialog);

  readonly infoWindow = viewChild<MapInfoWindow>('infoWindow');

  // ── Inputs ─────────────────────────────────────────────────────
  readonly mapHeight = input<number>(450);
  readonly mapWidth = input<number>(typeof screen !== 'undefined' ? screen.width : 400);
  readonly modelNo = input<string>('');
  readonly size = input<number>(0);
  readonly variantId = input<string>('');
  readonly cartProducts = input<CartProduct[]>([]);

  // ── Local state ────────────────────────────────────────────────
  readonly isStoreSelected = signal(false);
  readonly currentStore = signal<Store | null>(null);
  readonly storeLocations = signal<google.maps.LatLngLiteral[]>([]);
  readonly storeList = signal<Store[]>([]);

  readonly currentUserLocation = signal<google.maps.LatLngLiteral>({
    lat: 31.4914,
    lng: 74.2385,
  });

  /** Custom map styles */
  readonly mapStyles: google.maps.MapTypeStyle[] = [
    { featureType: 'administrative', elementType: 'all', stylers: [{ visibility: 'simplified' }] },
    { featureType: 'landscape', elementType: 'geometry', stylers: [{ visibility: 'simplified' }, { color: '#fcfcfc' }] },
    { featureType: 'poi', elementType: 'geometry', stylers: [{ visibility: 'simplified' }, { color: '#fcfcfc' }] },
    { featureType: 'road.highway', elementType: 'geometry', stylers: [{ visibility: 'simplified' }, { color: '#dddddd' }] },
    { featureType: 'road.arterial', elementType: 'geometry', stylers: [{ visibility: 'simplified' }, { color: '#dddddd' }] },
    { featureType: 'road.local', elementType: 'geometry', stylers: [{ visibility: 'simplified' }, { color: '#eeeeee' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ visibility: 'simplified' }, { color: '#dddddd' }] },
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

  directionsResults$!: Observable<google.maps.DirectionsResult | undefined>;

  ngOnInit(): void {
    this.storeLocations.set(this.cncService.markerPositions());
    this.storeList.set(this.cncService.stores());
    this.currentStore.set(this.storeList()[0] ?? null);

    const s = this.size();
    if (s > 0) {
      this.checkProductAvailability(this.modelNo(), s, this.variantId());
    } else if (this.cartProducts().length > 0) {
      this.checkAllProductsAvailability(this.cartProducts());
    }
  }

  onGetCurrentLocation(): void {
    this.cncService.getCurrentLocation();
    setTimeout(() => {
      this.options.set({ center: this.cncService.currentLocation() });
      this.currentUserLocation.set(this.cncService.currentLocation());
    }, 500);
  }

  onGetDirections(location: { lat: number; lng: number }): void {
    this.cncService.getDirections(location);
    this.directionsResults$ = this.cncService.storeDirectionsResults$;
    this.options.update((o) => ({ ...o, zoom: 2 }));
  }

  openInfoWindow(marker: MapMarker, store: Store, event: google.maps.MapMouseEvent): void {
    this.currentStore.set(store);
    this.infoWindow()?.open(marker);
    if (event.latLng) {
      this.cncService.currentStoreLocation = event.latLng.toJSON();
    }
  }

  onStoreSelect(store: Store): void {
    const user = this.cncService.user();
    if (user) {
      this.cncService.storeSelected.next(store);
    } else {
      this.cncService.setUser({ name: 'Anonymous', storeSelected: store } as any);
      this.cncService.storeSelected.next(store);
    }
    this.infoWindow()?.close();
    this.dialog.closeAll();
    this.isStoreSelected.set(true);
  }

  reselectStore(): void {
    this.isStoreSelected.set(false);
  }

  // ── Availability checks ────────────────────────────────────────
  private checkProductAvailability(modelNo: string, productSize: number, variantId: string): void {
    const allLocations = this.storeLocations();
    const allStores = this.storeList();
    const newLocations: google.maps.LatLngLiteral[] = [];
    const newStores: Store[] = [];

    allStores.forEach((store, i) => {
      for (const product of store.products) {
        if (product.modelNo !== modelNo) continue;
        for (const variant of product.variants) {
          if (variant.variantId !== variantId) continue;
          for (let j = 0; j < variant.sizes.length; j++) {
            if (+variant.sizes[j] === +productSize && +variant.instock[j] > 0) {
              newLocations.push(allLocations[i]);
              newStores.push(allStores[i]);
            }
          }
        }
      }
    });

    this.storeLocations.set(newLocations);
    this.storeList.set(newStores);
  }

  private checkAllProductsAvailability(cart: CartProduct[]): void {
    const allLocations = this.storeLocations();
    const allStores = this.storeList();
    const newLocations: google.maps.LatLngLiteral[] = [];
    const newStores: Store[] = [];

    allStores.forEach((store, i) => {
      let matched = 0;
      for (const product of store.products) {
        for (const cp of cart) {
          if (product.modelNo !== cp.modelNo) continue;
          for (const variant of product.variants) {
            if (variant.variantId !== cp.variantId) continue;
            for (let j = 0; j < variant.sizes.length; j++) {
              if (+variant.sizes[j] === cp.size && +variant.instock[j] >= cp.noOfItems) {
                matched++;
              }
            }
          }
        }
      }
      if (matched === cart.length) {
        newLocations.push(allLocations[i]);
        newStores.push(allStores[i]);
      }
    });

    this.storeLocations.set(newLocations);
    this.storeList.set(newStores);
  }
}
