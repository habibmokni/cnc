import {
  Component,
  ChangeDetectionStrategy,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { RouterModule } from '@angular/router';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ClickNCollectService } from '../../services/click-n-collect.service';
import { ProductAvailabilityComponent } from '../product-availability/product-availability.component';
import { CartProduct } from '../../types/cart.type';
import { Store } from '../../types/store.type';
import { CncUser } from '../../types/user.type';

@Component({
  selector: 'cnc-click-n-collect',
  standalone: true,
  imports: [
    RouterModule,
    MatExpansionModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatRadioModule,
    MatDividerModule,
  ],
  templateUrl: './click-n-collect.component.html',
  styleUrl: './click-n-collect.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ClickNCollectComponent {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly cncService = inject(ClickNCollectService);

  readonly expansionPanel = viewChild<MatExpansionPanel>('timePanel');

  // ── Inputs ─────────────────────────────────────────────────────
  readonly cartProductsInput = input<CartProduct[]>([], { alias: 'cartProducts' });
  readonly storesInput = input<Store[]>([], { alias: 'stores' });
  readonly userInput = input<CncUser | null>(null, { alias: 'user' });
  readonly storeLocationsInput = input<google.maps.LatLngLiteral[]>([], {
    alias: 'storeLocations',
  });

  // ── Outputs ────────────────────────────────────────────────────
  readonly dateSelected = output<Date>();
  readonly productsToRemove = output<CartProduct[]>();
  readonly orderPrice = output<number>();
  readonly timeSelected = output<string>();
  readonly storeChanged = output<Store>();
  readonly isAllItemsAvailable = output<boolean>();

  // ── Derived state (pure computeds) ─────────────────────────────
  readonly user = computed(
    () => this.cncService.user() ?? this.userInput(),
  );

  readonly cartProducts = computed(() => {
    const fromService = this.cncService.cartProducts();
    return fromService.length > 0 ? fromService : this.cartProductsInput();
  });

  readonly isStoreSelected = computed(
    () => !!this.user()?.storeSelected,
  );

  /** Pure stock derivation — recalculates whenever user or cart changes. */
  readonly stockCheck = computed(() => {
    const u = this.user();
    const cart = this.cartProducts();
    if (!u?.storeSelected?.products) {
      return { allAvailable: true, unavailable: [] as CartProduct[], total: 0 };
    }
    return this.cncService.checkCartStock(cart, u.storeSelected.products);
  });

  readonly allItemsAvailable = computed(() => this.stockCheck().allAvailable);
  readonly cartItemUnavailable = computed(() => this.stockCheck().unavailable);
  readonly grandTotal = computed(() => this.stockCheck().total);

  // ── Local mutable state (calendar / time slots) ────────────────
  readonly date = signal<Date | null>(null);
  readonly times = signal<number[]>([]);
  readonly selectedDayIndex = signal(-1);

  readonly calendar: Date[] = [];
  readonly days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  private readonly currentTime: number;

  constructor() {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    this.currentTime = now.getHours();

    for (let i = 0; i < 7; i++) {
      if (i === 0 && this.currentTime > 19) continue;
      this.calendar.push(new Date(year, month, day + i));
    }

    // ── Side-effects via effect() ──────────────────────────────

    // Emit storeChanged when a new store is selected
    effect(() => {
      const store = this.cncService.selectedStore();
      if (store) {
        this.storeChanged.emit(store);
      }
    });

    // Emit stock-related outputs when derivation changes
    effect(() => {
      const u = this.user();
      if (!u?.storeSelected) return;
      const { total, allAvailable } = this.stockCheck();
      this.orderPrice.emit(total);
      this.isAllItemsAvailable.emit(allAvailable);
    });
  }

  // ── Actions ────────────────────────────────────────────────────
  onDaySelect(index: number, date: Date): void {
    if (this.selectedDayIndex() === index) {
      this.selectedDayIndex.set(-1);
      this.times.set([]);
      return;
    }

    this.selectedDayIndex.set(index);
    this.date.set(date);
    this.dateSelected.emit(date);

    const now = new Date();
    const start =
      date.toDateString() === now.toDateString() ? this.currentTime + 1 : 10;
    const newTimes: number[] = [];
    for (let i = start; i < 20; i++) {
      newTimes.push(i);
    }
    this.times.set(newTimes);
  }

  onTimeSelected(time: number): void {
    this.timeSelected.emit(`${time}:00 - ${time + 1}:00`);
    this.expansionPanel()?.close();
  }

  onOpenDialog(): void {
    this.dialog.open(ProductAvailabilityComponent, {
      data: { call: 'checkout' },
    });
  }

  removeProductsUnavailable(): void {
    this.productsToRemove.emit(this.cartItemUnavailable());
    this.isAllItemsAvailable.emit(true);
  }

  selectStore(): void {
    this.router.navigate(['/storeselector']);
  }
}
