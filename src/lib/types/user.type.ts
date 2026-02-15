import { CncSelectedStore } from './store.type';

/**
 * Minimal user contract — only `storeSelected` is required by cnc.
 * Consumers extend with their own fields (e.g. email, firstName, wishlist).
 *
 * @example
 * ```ts
 * interface ShopUser extends CncUser {
 *   firstName: string;
 *   lastName: string;
 *   email: string;
 *   wishlist: string[];
 * }
 * ```
 */
export interface CncUser {
  storeSelected: CncSelectedStore;
}
