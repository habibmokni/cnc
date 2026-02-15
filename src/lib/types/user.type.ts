/** The user's selected store reference. */
export type SelectedStore = Readonly<{
  id: string;
  name: string;
  address: string;
  products?: any[];
}>;

/** The current user. */
export type CncUser = Readonly<{
  firstName?: string;
  lastName?: string;
  name?: string;
  email?: string;
  address?: string;
  zipCode?: string;
  storeSelected: SelectedStore;
  wishlist?: string[];
}>;
