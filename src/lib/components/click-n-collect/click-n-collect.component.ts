import {
	Component,
	ChangeDetectionStrategy,
	computed,
	effect,
	inject,
	input,
	output,
	signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTimepickerModule } from '@angular/material/timepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNativeDateAdapter } from '@angular/material/core';
import { ClickNCollectService } from '../../services/click-n-collect.service';
import { StoreCardComponent } from '../store-card/store-card.component';
import { CncCartItem } from '../../types/cart.type';
import { CncStore } from '../../types/store.type';
import { CncUser } from '../../types/user.type';

@Component({
	selector: 'cnc-click-n-collect',
	standalone: true,
	imports: [
		DatePipe,
		MatButtonModule,
		MatIconModule,
		MatDividerModule,
		MatDatepickerModule,
		MatTimepickerModule,
		MatFormFieldModule,
		MatInputModule,
		StoreCardComponent,
	],
	providers: [provideNativeDateAdapter()],
	templateUrl: './click-n-collect.component.html',
	styleUrl: './click-n-collect.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClickNCollectComponent {
	private readonly cncService = inject(ClickNCollectService);

	// ── Inputs ────────────────────────────────────────────────────
	public readonly stores = input<CncStore[]>([]);
	public readonly cartProducts = input<CncCartItem[]>([]);
	public readonly user = input<CncUser | null>(null);

	// ── Outputs ───────────────────────────────────────────────────
	public readonly storeChanged = output<CncStore>();
	public readonly dateSelected = output<Date>();
	public readonly timeSelected = output<string>();
	public readonly productsToRemove = output<CncCartItem[]>();
	public readonly orderPrice = output<number>();
	public readonly isAllItemsAvailable = output<boolean>();

	// ── Store selection state ─────────────────────────────────────
	protected readonly selectedStoreId = signal<string | null>(null);
	protected readonly otherStoresExpanded = signal(false);

	/** Resolve full store from the stores input (fresh product data). */
	protected readonly selectedStore = computed<CncStore | null>(() => {
		const id = this.selectedStoreId();
		if (!id) return null;
		return this.stores().find((store) => store.id === id) ?? null;
	});

	/** All stores except the selected one. */
	protected readonly otherStores = computed<CncStore[]>(() => {
		const id = this.selectedStoreId();
		if (!id) return [];
		return this.stores().filter((store) => store.id !== id);
	});

	// ── Stock computation — from stores input, NOT user.storeSelected ──
	protected readonly stockMap = computed<Record<string, number>>(() => {
		const allStores = this.stores();
		const cartItems = this.cartProducts();
		if (!allStores.length || !cartItems.length) return {};
		const map: Record<string, number> = {};
		for (const store of allStores) {
			let allAvailable = true;
			for (const cartItem of cartItems) {
				const storeProduct = store.products?.find(
					(product) => product.modelNo === cartItem.modelNo,
				);
				if (!storeProduct?.variants?.[0]) {
					allAvailable = false;
					break;
				}
				const variant =
					storeProduct.variants.find((v) => v.variantId === cartItem.variantId) ??
					storeProduct.variants[0];
				const sizeIndex = variant.sizes?.indexOf(cartItem.size) ?? -1;
				const stock = sizeIndex >= 0 ? +(variant.inStock?.[sizeIndex] ?? 0) : 0;
				if (stock < cartItem.noOfItems) {
					allAvailable = false;
					break;
				}
			}
			map[store.id] = allAvailable ? 10 : 0;
		}
		return map;
	});

	/** Distance map — from service distances aligned to stores. */
	protected readonly distanceMap = computed<Record<string, number>>(() => {
		const distances = this.cncService.distanceInKm();
		const allStores = this.stores();
		const map: Record<string, number> = {};
		allStores.forEach((store, idx) => {
			map[store.id] = distances[idx] ?? Infinity;
		});
		return map;
	});

	/** Unavailable products at the selected store. */
	protected readonly unavailableProducts = computed<CncCartItem[]>(() => {
		const store = this.selectedStore();
		if (!store) return [];
		const cartItems = this.cartProducts();
		const unavailable: CncCartItem[] = [];
		for (const cartItem of cartItems) {
			const storeProduct = store.products?.find(
				(product) => product.modelNo === cartItem.modelNo,
			);
			if (!storeProduct) {
				unavailable.push(cartItem);
				continue;
			}
			const variant = storeProduct.variants?.find((v) => v.variantId === cartItem.variantId);
			if (!variant) {
				unavailable.push(cartItem);
				continue;
			}
			const sizeIndex = variant.sizes?.indexOf(cartItem.size) ?? -1;
			const stock = sizeIndex >= 0 ? (variant.inStock?.[sizeIndex] ?? 0) : 0;
			if (stock < cartItem.noOfItems) {
				unavailable.push(cartItem);
			}
		}
		return unavailable;
	});

	protected readonly allAvailable = computed(
		() => this.selectedStore() != null && this.unavailableProducts().length === 0,
	);

	/** Grand total of cart items. */
	protected readonly grandTotal = computed(() => {
		return this.cartProducts().reduce((sum, item) => sum + item.price * item.noOfItems, 0);
	});

	// ── Date/Time — Material DatePicker + TimePicker ──────────────
	protected readonly selectedDate = signal<Date | null>(null);
	protected readonly selectedTime = signal<string | null>(null);

	protected readonly minDate = new Date();
	protected readonly maxDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

	/** Filter: weekdays only (Mon-Fri). */
	protected readonly weekdayFilter = (date: Date | null): boolean => {
		if (!date) return false;
		const day = date.getDay();
		return day !== 0 && day !== 6;
	};

	/** Min pickup time based on selected store's opening hours. */
	protected readonly minTime = computed<Date>(() => {
		const store = this.selectedStore();
		const hour = store?.openingTime?.open ? parseInt(store.openingTime.open, 10) : 10;
		const d = new Date();
		d.setHours(isNaN(hour) ? 10 : hour, 0, 0, 0);
		return d;
	});

	/** Max pickup time based on selected store's closing hours. */
	protected readonly maxTime = computed<Date>(() => {
		const store = this.selectedStore();
		const hour = store?.openingTime?.close ? parseInt(store.openingTime.close, 10) : 19;
		const d = new Date();
		d.setHours(isNaN(hour) ? 19 : hour, 0, 0, 0);
		return d;
	});

	/** Summary is complete when store + date + time are all selected. */
	protected readonly isComplete = computed(
		() =>
			this.selectedStore() != null &&
			this.selectedDate() != null &&
			this.selectedTime() != null,
	);

	public constructor() {
		// Pre-select user's previously chosen store on init.
		effect(() => {
			const currentUser = this.user();
			if (currentUser?.storeSelected?.id && !this.selectedStoreId()) {
				this.selectedStoreId.set(currentUser.storeSelected.id);
			}
		});

		// Emit outputs reactively.
		effect(() => {
			const store = this.selectedStore();
			if (store) {
				this.storeChanged.emit(store);
				this.cncService.selectStore(store);
			}
		});

		effect(() => {
			this.orderPrice.emit(this.grandTotal());
			this.isAllItemsAvailable.emit(this.allAvailable());
		});
	}

	// ── Actions ───────────────────────────────────────────────────
	protected onStoreSelect(store: CncStore): void {
		this.selectedStoreId.set(store.id);
		this.otherStoresExpanded.set(false);
	}

	protected onDateChange(date: Date | null): void {
		this.selectedDate.set(date);
		if (date) {
			this.dateSelected.emit(date);
		}
	}

	protected onTimeChange(time: Date | null): void {
		if (!time) {
			this.selectedTime.set(null);
			return;
		}
		const hours = time.getHours().toString().padStart(2, '0');
		const minutes = time.getMinutes().toString().padStart(2, '0');
		const formatted = `${hours}:${minutes}`;
		this.selectedTime.set(formatted);
		this.timeSelected.emit(formatted);
	}

	protected removeUnavailable(): void {
		this.productsToRemove.emit(this.unavailableProducts());
	}
}
