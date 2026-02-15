/** The user's selected store reference. */
export interface SelectedStore {
  id: string;
  name: string;
  address: string;
  products?: any[];
}

/** The current user. */
export interface CncUser {
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  address?: string;
  zipCode?: string;
  storeSelected: SelectedStore;
  wishlist?: string[];
}
