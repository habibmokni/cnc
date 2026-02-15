/** A product in the shopping cart. */
export interface CartProduct {
  modelNo: string;
  productName: string;
  productImage: string;
  vendor: string;
  price: number;
  size: number;
  noOfItems: number;
  variantId?: string;
}
