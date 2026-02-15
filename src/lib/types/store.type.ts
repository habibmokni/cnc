/**
 * Minimal variant contract for stock checking.
 * Consumers may extend with extra fields (e.g. color, sku).
 */
export interface CncVariant {
	variantId: string;
	sizes: number[];
	inStock: number[];
}

/**
 * Minimal product contract for in-store inventory.
 * Consumers may extend with extra fields (e.g. brand, images).
 */
export interface CncStoreProduct {
	modelNo: string;
	variants: CncVariant[];
}

/**
 * Subset of CncStore carried on the user after selection.
 * Products are optional — may not be populated yet.
 */
export interface CncSelectedStore {
	id: string;
	name: string;
	address: string;
	products?: CncStoreProduct[];
}

/**
 * Minimal store contract. Consumers extend with richer fields
 * (e.g. openingTime, description, reviews).
 */
export interface CncStore extends CncSelectedStore {
	location: { lat: number; lng: number };
	products: CncStoreProduct[];
}

/**
 * A store paired with computed distance and optional stock count.
 * Generic so the consumer's richer store type is preserved.
 */
export interface CncNearbyStore<TStore extends CncStore = CncStore> {
	store: TStore;
	distance: number;
	stock?: number;
}
