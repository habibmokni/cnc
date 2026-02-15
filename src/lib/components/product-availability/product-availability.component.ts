import {
	Component,
	ChangeDetectionStrategy,
	ElementRef,
	computed,
	effect,
	inject,
	signal,
	viewChild,
	NgZone,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ClickNCollectService } from '../../services/click-n-collect.service';
import { MapsComponent } from '../maps/maps.component';
import { StoreCardComponent } from '../store-card/store-card.component';
import { CncStore, CncNearbyStore } from '../../types/store.type';
import { ProductAvailabilityDialogData } from '../../types/dialog.type';

@Component({
	selector: 'cnc-product-availability',
	standalone: true,
	imports: [
		MatDialogModule,
		MatTabsModule,
		MatButtonModule,
		MatIconModule,
		MatInputModule,
		MatDividerModule,
		MatFormFieldModule,
		MapsComponent,
		StoreCardComponent,
	],
	templateUrl: './product-availability.component.html',
	styleUrl: './product-availability.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductAvailabilityComponent {
	private readonly ngZone = inject(NgZone);
	private readonly cncService = inject(ClickNCollectService);
	private readonly dialogRef = inject(MatDialogRef<ProductAvailabilityComponent>);
	protected readonly data: ProductAvailabilityDialogData = inject(MAT_DIALOG_DATA);

	private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

	protected readonly stores = computed(() => this.cncService.stores());
	protected readonly cartProducts = computed(() => this.cncService.cartProducts());

	protected readonly nearbyStores = signal<CncNearbyStore[]>([]);
	protected readonly pendingStore = signal<CncStore | null>(null);

	private readonly geoRequested = signal(false);

	public constructor() {
		effect((onCleanup) => {
			const el = this.searchInput()?.nativeElement;
			if (!el) return;

			const autocomplete = new google.maps.places.Autocomplete(el);
			const listener = autocomplete.addListener('place_changed', () => {
				this.ngZone.run(() => {
					this.nearbyStores.set([]);
					const place = autocomplete.getPlace();
					if (!place.geometry?.location) return;

					const lat = place.geometry.location.lat();
					const lng = place.geometry.location.lng();
					this.cncService.findClosestMarker(lat, lng);
					this.loadNearbyStores();
				});
			});

			onCleanup(() => google.maps.event.removeListener(listener));
		});

		// React to geolocation resolving after user clicks "use my location".
		effect(() => {
			const loc = this.cncService.currentLocation();
			if (!loc || !this.geoRequested()) return;
			this.cncService.findClosestMarker(loc.lat, loc.lng);
			this.loadNearbyStores();
			this.geoRequested.set(false);
		});
	}

	protected close(): void {
		this.dialogRef.close();
	}

	protected useCurrentLocation(): void {
		this.geoRequested.set(true);
		this.cncService.getCurrentLocation();
	}

	protected onStoreSelect(store: CncStore): void {
		this.pendingStore.set(store);
	}

	protected confirmStoreSelection(): void {
		const store = this.pendingStore();
		if (!store) return;
		this.cncService.selectStore(store);
		this.dialogRef.close(store);
	}

	private loadNearbyStores(): void {
		if (this.data.call === 'product' || this.data.call === 'size-selector') {
			this.nearbyStores.set(
				this.cncService.checkProductAvailability(
					this.data.modelNo ?? '',
					this.data.size ?? 0,
					this.data.variantId ?? '',
				),
			);
		}
		if (this.data.call === 'checkout') {
			this.nearbyStores.set(
				this.cncService.checkAllProductsAvailability(this.cartProducts()),
			);
		}
	}
}
