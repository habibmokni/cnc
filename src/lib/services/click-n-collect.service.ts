import { Injectable, signal, computed, inject } from '@angular/core';
import { MapDirectionsService } from '@angular/google-maps';
import { Store, NearbyStore } from '../types/store.type';
import { CncUser } from '../types/user.type';
import { CartProduct } from '../types/cart.type';

@Injectable({ providedIn: 'root' })
export class ClickNCollectService {
  private readonly mapDirectionsService = inject(MapDirectionsService);

  // ── State signals ───────────────────────────────────────────────
  readonly stores = signal<Store[]>([]);
  readonly cartProducts = signal<CartProduct[]>([]);
  readonly user = signal<CncUser | null>(null);
  readonly markerPositions = signal<google.maps.LatLngLiteral[]>([]);
  readonly currentLocation = signal<google.maps.LatLngLiteral>({
    lat: 51.44157584725519,
    lng: 7.565725496333208,
  });
  readonly distanceInKm = signal<number[]>([]);
  readonly selectedStore = signal<Store | null>(null);
  readonly directionsResult = signal<google.maps.DirectionsResult | undefined>(
    undefined,
  );

  // ── Derived ─────────────────────────────────────────────────────
  readonly nearbyStores = computed<NearbyStore[]>(() => {
    const distances = this.distanceInKm();
    return this.stores()
      .map((store, i) => ({ store, distance: distances[i] ?? Infinity }))
      .sort((a, b) => a.distance - b.distance);
  });

  // ── Setters (public API for consuming apps) ─────────────────────
  setStoreList(stores: Store[]): void {
    this.stores.set(stores);
  }

  setCartProducts(products: CartProduct[]): void {
    this.cartProducts.set(products);
  }

  setStoreLocations(locations: google.maps.LatLngLiteral[]): void {
    this.markerPositions.set(locations);
  }

  setUser(user: CncUser): void {
    this.user.set(user);
  }

  // ── Store selection (single source of truth) ────────────────────
  selectStore(store: Store): void {
    this.selectedStore.set(store);
    const u = this.user();
    const updated: CncUser = u
      ? { ...u, storeSelected: store }
      : { name: 'Anonymous', storeSelected: store };
    this.user.set(updated);
  }

  // ── Directions ──────────────────────────────────────────────────
  getDirections(location: { lat: number; lng: number }): void {
    this.mapDirectionsService
      .route({
        destination: location,
        origin: this.currentLocation(),
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .subscribe((response) => this.directionsResult.set(response.result));
  }

  // ── Geolocation ─────────────────────────────────────────────────
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

  // ── Distance calculation ────────────────────────────────────────
  findClosestMarker(lat: number, lng: number): void {
    const R = 6371;
    const rad = (x: number) => (x * Math.PI) / 180;
    const distances = this.markerPositions().map((m) => {
      const dLat = rad(m.lat - lat);
      const dLng = rad(m.lng - lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(rad(lat)) * Math.cos(rad(m.lat)) * Math.sin(dLng / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    });
    this.distanceInKm.set(distances);
  }

  // ── Pure stock utilities ────────────────────────────────────────

  /** Find in-store stock count for a specific product size. */
  findStockForSize(
    storeProducts: readonly any[],
    modelNo: string,
    variantId: string,
    size: number,
  ): number {
    for (const sp of storeProducts) {
      if (sp.modelNo !== modelNo) continue;
      for (const v of sp.variants) {
        if (v.variantId !== variantId) continue;
        const idx = v.sizes.findIndex((s: number) => +s === +size);
        if (idx >= 0) return +v.instock[idx];
      }
    }
    return 0;
  }

  /** Check cart items against a store's inventory. Pure derivation. */
  checkCartStock(
    cart: readonly CartProduct[],
    storeProducts: readonly any[],
  ): Readonly<{
    allAvailable: boolean;
    unavailable: CartProduct[];
    total: number;
  }> {
    const unavailable: CartProduct[] = [];
    let total = 0;
    for (const p of cart) {
      const stock = this.findStockForSize(
        storeProducts,
        p.modelNo,
        p.variantId ?? '',
        p.size,
      );
      if (stock === 0) unavailable.push(p);
      total += p.price * p.noOfItems;
    }
    return { allAvailable: unavailable.length === 0, unavailable, total };
  }

  /** Check single-product availability across all stores. */
  checkProductAvailability(
    modelNo: string,
    size: number,
    variantId: string,
  ): NearbyStore[] {
    const distances = this.distanceInKm();
    const results: NearbyStore[] = [];
    this.stores().forEach((store, i) => {
      for (const product of store.products) {
        if (product.modelNo !== modelNo) continue;
        for (const variant of product.variants) {
          if (variant.variantId !== variantId) continue;
          for (let j = 0; j < variant.sizes.length; j++) {
            if (+variant.sizes[j] === +size) {
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
    return results.sort((a, b) => a.distance - b.distance);
  }

  /** Check full-cart availability across all stores. */
  checkAllProductsAvailability(cart: readonly CartProduct[]): NearbyStore[] {
    const distances = this.distanceInKm();
    const results: NearbyStore[] = [];
    this.stores().forEach((store, i) => {
      let allInStock = true;
      for (const cp of cart) {
        const stock = this.findStockForSize(
          store.products,
          cp.modelNo,
          cp.variantId ?? '',
          cp.size,
        );
        if (stock < cp.noOfItems) {
          allInStock = false;
          break;
        }
      }
      results.push({
        store,
        stock: allInStock ? 10 : 0,
        distance: distances[i] ?? Infinity,
      });
    });
    return results.sort((a, b) => a.distance - b.distance);
  }

  /** Filter stores that have a specific product in stock. */
  filterByProductAvailability(
    modelNo: string,
    size: number,
    variantId: string,
  ): Readonly<{
    stores: Store[];
    locations: google.maps.LatLngLiteral[];
  }> {
    const allStores = this.stores();
    const allLocations = this.markerPositions();
    const stores: Store[] = [];
    const locations: google.maps.LatLngLiteral[] = [];

    allStores.forEach((store, i) => {
      for (const product of store.products) {
        if (product.modelNo !== modelNo) continue;
        for (const variant of product.variants) {
          if (variant.variantId !== variantId) continue;
          for (let j = 0; j < variant.sizes.length; j++) {
            if (+variant.sizes[j] === +size && +variant.instock[j] > 0) {
              stores.push(store);
              locations.push(allLocations[i]);
            }
          }
        }
      }
    });
    return { stores, locations };
  }

  /** Filter stores that have all cart products in stock. */
  filterByCartAvailability(
    cart: readonly CartProduct[],
  ): Readonly<{
    stores: Store[];
    locations: google.maps.LatLngLiteral[];
  }> {
    const allStores = this.stores();
    const allLocations = this.markerPositions();
    const stores: Store[] = [];
    const locations: google.maps.LatLngLiteral[] = [];

    allStores.forEach((store, i) => {
      const allInStock = cart.every((cp) => {
        const stock = this.findStockForSize(
          store.products,
          cp.modelNo,
          cp.variantId ?? '',
          cp.size,
        );
        return stock >= cp.noOfItems;
      });
      if (allInStock) {
        stores.push(store);
        locations.push(allLocations[i]);
      }
    });
    return { stores, locations };
  }
}
