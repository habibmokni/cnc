import {
	Component,
	ChangeDetectionStrategy,
	ElementRef,
	effect,
	inject,
	signal,
	viewChild,
	NgZone,
} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatExpansionModule } from '@angular/material/expansion';
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
import { CheckAvailabilityDialogData } from '../../types/dialog.type';

@Component({
	selector: 'cnc-check-availability',
	standalone: true,
	imports: [
		MatDialogModule,
		MatExpansionModule,
		MatTabsModule,
		MatButtonModule,
		MatIconModule,
		MatInputModule,
		MatDividerModule,
		MatFormFieldModule,
		MapsComponent,
		StoreCardComponent,
	],
	templateUrl: './check-availability.component.html',
	styleUrl: './check-availability.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CheckAvailabilityComponent {
	private readonly ngZone = inject(NgZone);
	private readonly cncService = inject(ClickNCollectService);
	private readonly dialogRef = inject(MatDialogRef<CheckAvailabilityComponent>);
	protected readonly data: CheckAvailabilityDialogData = inject(MAT_DIALOG_DATA);

	private readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

	// ── Local state ────────────────────────────────────────────────
	protected readonly nearbyStores = signal<CncNearbyStore[]>([]);
	protected readonly size = signal(0);
	protected readonly isSizeSelected = signal(false);
	protected readonly step = signal(0);
	protected readonly pendingStore = signal<CncStore | null>(null);

	private readonly geoRequested = signal(false);

	public constructor() {
		if (this.data.size) {
			this.size.set(this.data.size);
			this.isSizeSelected.set(true);
			this.step.set(1);
		}

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
					this.nearbyStores.set(
						this.cncService.checkProductAvailability(
							this.data.modelNo,
							this.size(),
							this.data.variantId,
						),
					);
				});
			});

			onCleanup(() => google.maps.event.removeListener(listener));
		});

		// React to geolocation resolving after user clicks "use my location".
		effect(() => {
			const loc = this.cncService.currentLocation();
			if (!loc || !this.geoRequested()) return;
			this.cncService.findClosestMarker(loc.lat, loc.lng);
			this.nearbyStores.set(
				this.cncService.checkProductAvailability(
					this.data.modelNo,
					this.size(),
					this.data.variantId,
				),
			);
			this.geoRequested.set(false);
		});
	}

	protected close(): void {
		this.dialogRef.close();
	}

	protected changeSize(newSize: number): void {
		this.nearbyStores.set([]);
		this.size.set(newSize);
		this.isSizeSelected.set(true);
		this.step.set(1);
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
}
