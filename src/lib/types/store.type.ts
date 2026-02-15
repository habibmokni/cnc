/** A product variant with sizes and stock counts per size. */
export type StoreVariant = Readonly<{
  variantId: string;
  sizes: number[];
  instock: number[];
}>;

/** A product carried by a store, with its variants. */
export type StoreProduct = Readonly<{
  modelNo: string;
  variants: StoreVariant[];
}>;

/** Opening hours for a store. */
export type OpeningTime = Readonly<{
  open: string;
  close: string;
}>;

/** A physical store location. */
export type Store = Readonly<{
  id: string;
  name: string;
  address: string;
  location: { lat: number; lng: number };
  openingTime: OpeningTime;
  description?: string;
  reviews?: string;
  isDefault?: boolean;
  products: StoreProduct[];
}>;

/** A store with computed distance from the user. */
export type NearbyStore = Readonly<{
  store: Store;
  distance: number;
  stock?: number;
}>;
