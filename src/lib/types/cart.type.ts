/** A product in the shopping cart. */
export type CartProduct = Readonly<{
  modelNo: string;
  productName: string;
  productImage: string;
  vendor: string;
  price: number;
  size: number;
  noOfItems: number;
  variantId?: string;
}>;
