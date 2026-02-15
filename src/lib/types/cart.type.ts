/**
 * Minimal cart item contract — only the fields cnc needs for stock
 * checking, display, and price calculation.
 * Consumers extend with their own fields (e.g. brand, category, images).
 *
 * @example
 * ```ts
 * interface ShoeCartItem extends CncCartItem {
 *   brand: string;
 *   category: 'men' | 'women' | 'kids';
 *   images: string[];
 * }
 * ```
 */
export interface CncCartItem {
	modelNo: string;
	productName: string;
	productImage: string;
	price: number;
	size: number;
	noOfItems: number;
	variantId?: string;
}
