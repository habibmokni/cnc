import { Injectable, signal, computed, inject } from '@angular/core';
import { MapDirectionsService } from '@angular/google-maps';
import {
  CncStore,
  CncStoreProduct,
  CncSelectedStore,
  CncNearbyStore,
} from '../types/store.type';
import { CncUser } from '../types/user.type';
import { CncCartItem } from '../types/cart.type';

/**
 * Central Click & Collect service.
 *
 * Generic so consumers keep their richer types:
 * ```ts
 * private cncService = inject(ClickNCollectService<ShoeStore, ShoeCartItem, ShoeUser>);
 * ```
 *
 * Default type parameters fall back to the minimal cnc interfaces,
 * so library components work without specifying generics.
 */
@Injectable({ providedIn: 'root' })
export class ClickNCollectService<
  TStore extends CncStore = CncStore,
  TCartItem extends CncCartItem = CncCartItem,
  TUser extends CncUser = CncUser,
> {
  private readonly mapDirectionsService = inject(MapDirectionsService);

  // ── State signals ───────────────────────────────────────────────
  public readonly stores = signal<TStore[]>([]);
  public readonly cartProducts = signal<TCartItem[]>([]);
  public readonly user = signal<TUser | null>(null);
  public readonly markerPositions = signal<google.maps.LatLngLiteral[]>([]);
  public readonly currentLocation = signal<google.maps.LatLngLiteral | null>(
    null,
  );
  public readonly distanceInKm = signal<number[]>([]);
  public readonly selectedStore = signal<TStore | null>(null);
  public readonly directionsResult = signal<
    google.maps.DirectionsResult | undefined
  >(undefined);

  constructor() {
    this.getCurrentLocation();
  }

  // ── Derived ─────────────────────────────────────────────────────
  public readonly nearbyStores = computed<CncNearbyStore<TStore>[]>(() => {
    const distances = this.distanceInKm();
    return this.stores()
      .map((store, i) => ({ store, distance: distances[i] ?? Infinity }))
      .sort((a, b) => a.distance - b.distance);
  });

  // ── Setters (public API for consuming apps) ─────────────────────
  public setStoreList(stores: TStore[]): void {
    this.stores.set(stores);
  }

  public setCartProducts(products: TCartItem[]): void {
    this.cartProducts.set(products);
  }

  public setStoreLocations(locations: google.maps.LatLngLiteral[]): void {
    this.markerPositions.set(locations);
  }

  public setUser(user: TUser): void {
    this.user.set(user);
  }

  // ── Store selection (single source of truth) ────────────────────
  /**
   * Select a store and update the user's `storeSelected` reference.
   * If no user exists, a minimal anonymous user is created.
   */
  public selectStore(store: TStore): void {
    this.selectedStore.set(store);
    const currentUser = this.user();
    if (currentUser) {
      this.user.set({ ...currentUser, storeSelected: store } as TUser);
    } else {
      // Safe: library only reads `storeSelected` from the user.
      // Consumer-specific fields won't exist on anonymous users.
      this.user.set({ storeSelected: store } as unknown as TUser);
    }
  }

  // ── Directions ──────────────────────────────────────────────────
  public getDirections(location: { lat: number; lng: number }): void {
    const origin = this.currentLocation();
    if (!origin) return;
    this.mapDirectionsService
      .route({
        destination: location,
        origin,
        travelMode: google.maps.TravelMode.DRIVING,
      })
      .subscribe((response) => this.directionsResult.set(response.result));
  }

  // ── Geolocation ─────────────────────────────────────────────────
  public getCurrentLocation(): void {
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
  public findClosestMarker(lat: number, lng: number): void {
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
  public findStockForSize(
    storeProducts: readonly CncStoreProduct[],
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

  /**
   * Check cart items against a store's inventory.
   * Generic on T so the `unavailable` array preserves the consumer's cart type.
   */
  public checkCartStock<T extends CncCartItem>(
    cart: readonly T[],
    storeProducts: readonly CncStoreProduct[],
  ): Readonly<{
    allAvailable: boolean;
    unavailable: T[];
    total: number;
  }> {
    const unavailable: T[] = [];
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
  public checkProductAvailability(
    modelNo: string,
    size: number,
    variantId: string,
  ): CncNearbyStore<TStore>[] {
    const distances = this.distanceInKm();
    const results: CncNearbyStore<TStore>[] = [];
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
  public checkAllProductsAvailability(
    cart: readonly CncCartItem[],
  ): CncNearbyStore<TStore>[] {
    const distances = this.distanceInKm();
    const results: CncNearbyStore<TStore>[] = [];
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
  public filterByProductAvailability(
    modelNo: string,
    size: number,
    variantId: string,
  ): Readonly<{
    stores: TStore[];
    locations: google.maps.LatLngLiteral[];
  }> {
    const allStores = this.stores();
    const allLocations = this.markerPositions();
    const stores: TStore[] = [];
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
  public filterByCartAvailability(
    cart: readonly CncCartItem[],
  ): Readonly<{
    stores: TStore[];
    locations: google.maps.LatLngLiteral[];
  }> {
    const allStores = this.stores();
    const allLocations = this.markerPositions();
    const stores: TStore[] = [];
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
