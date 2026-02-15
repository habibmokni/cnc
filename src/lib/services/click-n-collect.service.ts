import { Injectable, signal, computed, inject } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { map } from 'rxjs/operators';
import { MapDirectionsService } from '@angular/google-maps';
import { Store, NearbyStore } from '../types/store.type';
import { CncUser } from '../types/user.type';
import { CartProduct } from '../types/cart.type';

@Injectable({ providedIn: 'root' })
export class ClickNCollectService {
  private readonly mapDirectionsService = inject(MapDirectionsService);

  // ── Signals ──────────────────────────────────────────────────────
  readonly stores = signal<Store[]>([]);
  readonly cartProducts = signal<CartProduct[]>([]);
  readonly user = signal<CncUser | null>(null);
  readonly markerPositions = signal<google.maps.LatLngLiteral[]>([]);
  readonly currentLocation = signal<google.maps.LatLngLiteral>({
    lat: 51.44157584725519,
    lng: 7.565725496333208,
  });
  readonly distanceInKm = signal<number[]>([]);

  /** Emits whenever the user selects / changes a store. */
  readonly storeSelected = new Subject<Store>();

  /** Observable directions result for the current store. */
  storeDirectionsResults$!: Observable<google.maps.DirectionsResult | undefined>;
  currentStoreLocation!: google.maps.LatLngLiteral;

  // ── Computed ─────────────────────────────────────────────────────
  readonly nearbyStores = computed<NearbyStore[]>(() => {
    const distances = this.distanceInKm();
    return this.stores()
      .map((store, i) => ({ store, distance: distances[i] ?? Infinity }))
      .sort((a, b) => a.distance - b.distance);
  });

  // ── Store list ───────────────────────────────────────────────────
  setStoreList(stores: Store[]): void {
    this.stores.set(stores);
  }

  // ── Cart ─────────────────────────────────────────────────────────
  setCartProducts(products: CartProduct[]): void {
    this.cartProducts.set(products);
  }

  // ── Locations ────────────────────────────────────────────────────
  setStoreLocations(locations: google.maps.LatLngLiteral[]): void {
    this.markerPositions.set(locations);
  }

  // ── User ─────────────────────────────────────────────────────────
  setUser(user: CncUser): void {
    this.user.set(user);
  }

  // ── Directions ───────────────────────────────────────────────────
  getDirections(location: { lat: number; lng: number }): void {
    const request: google.maps.DirectionsRequest = {
      destination: location,
      origin: this.currentLocation(),
      travelMode: google.maps.TravelMode.DRIVING,
    };
    this.storeDirectionsResults$ = this.mapDirectionsService
      .route(request)
      .pipe(map((response) => response.result));
  }

  // ── Geolocation ──────────────────────────────────────────────────
  getCurrentLocation(): void {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((position) => {
      const pos: google.maps.LatLngLiteral = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
      };
      this.currentLocation.set(pos);
      this.findClosestMarker(pos.lat, pos.lng);
    });
  }

  // ── Distance calculation ─────────────────────────────────────────
  findClosestMarker(lat: number, lng: number): void {
    const R = 6371; // Earth radius in km
    const rad = (x: number) => (x * Math.PI) / 180;
    const positions = this.markerPositions();

    const distances = positions.map((m) => {
      const dLat = rad(m.lat - lat);
      const dLng = rad(m.lng - lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(lat)) * Math.cos(rad(m.lat)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    });

    this.distanceInKm.set(distances);
  }
}
