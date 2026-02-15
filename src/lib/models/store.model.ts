/** A product variant with sizes and stock counts per size. */
export interface StoreVariant {
  variantId: string;
  sizes: number[];
  instock: number[];
}

/** A product carried by a store, with its variants. */
export interface StoreProduct {
  modelNo: string;
  variants: StoreVariant[];
}

/** Opening hours for a store. */
export interface OpeningTime {
  open: string;
  close: string;
}

/** A physical store location. */
export interface Store {
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  openingTime: OpeningTime;
  description?: string;
  reviews?: string;
  isDefault?: boolean;
  products: StoreProduct[];
}

/** A store with computed distance from the user. */
export interface NearbyStore {
  store: Store;
  distance: number;
  stock?: number;
}
