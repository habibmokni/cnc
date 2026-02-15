import { Component, ChangeDetectionStrategy, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { CncStore } from '../../types/store.type';

@Component({
	selector: 'cnc-store-card',
	standalone: true,
	imports: [MatIconModule],
	templateUrl: './store-card.component.html',
	styleUrl: './store-card.component.css',
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StoreCardComponent {
	public readonly store = input.required<CncStore>();
	public readonly selected = input<boolean>(false);
	public readonly stock = input<number | null>(null);
	public readonly distance = input<number | null>(null);

	public readonly storeSelect = output<CncStore>();

	protected readonly stockLabel = computed<string | null>(() => {
		const stockVal = this.stock();
		if (stockVal == null) return null;
		if (stockVal > 5) return 'In stock';
		if (stockVal > 0) return 'Low stock';
		return 'Unavailable';
	});

	protected readonly stockClass = computed<string>(() => {
		const stockVal = this.stock();
		if (stockVal == null) return '';
		if (stockVal > 5) return 'good';
		if (stockVal > 0) return 'low';
		return 'out';
	});

	protected onSelect(): void {
		this.storeSelect.emit(this.store());
	}
}
