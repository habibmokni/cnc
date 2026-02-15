/** Dialog data for ProductAvailabilityComponent. */
export type ProductAvailabilityDialogData = Readonly<{
	call: 'product' | 'size-selector' | 'checkout';
	modelNo?: string;
	size?: number;
	variantId?: string;
}>;

/** Dialog data for CheckAvailabilityComponent. */
export type CheckAvailabilityDialogData = Readonly<{
	modelNo: string;
	variantId: string;
	sizes: number[];
	size?: number;
}>;
