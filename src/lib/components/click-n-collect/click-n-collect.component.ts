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
import {
  MatExpansionModule,
  MatExpansionPanel,
} from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { ClickNCollectService } from '../../services/click-n-collect.service';
import { ProductAvailabilityComponent } from '../product-availability/product-availability.component';
import { CncCartItem } from '../../types/cart.type';
import { CncStore } from '../../types/store.type';
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

  private readonly expansionPanel =
    viewChild<MatExpansionPanel>('timePanel');

  // ── Inputs ─────────────────────────────────────────────────────
  public readonly cartProductsInput = input<CncCartItem[]>([], {
    alias: 'cartProducts',
  });
  public readonly storesInput = input<CncStore[]>([], { alias: 'stores' });
  public readonly userInput = input<CncUser | null>(null, { alias: 'user' });
  public readonly storeLocationsInput = input<google.maps.LatLngLiteral[]>(
    [],
    { alias: 'storeLocations' },
  );

  // ── Outputs ────────────────────────────────────────────────────
  public readonly dateSelected = output<Date>();
  public readonly productsToRemove = output<CncCartItem[]>();
  public readonly orderPrice = output<number>();
  public readonly timeSelected = output<string>();
  public readonly storeChanged = output<CncStore>();
  public readonly isAllItemsAvailable = output<boolean>();

  // ── Derived state (pure computeds) ─────────────────────────────
  protected readonly user = computed(
    () => this.cncService.user() ?? this.userInput(),
  );

  protected readonly cartProducts = computed(() => {
    const fromService = this.cncService.cartProducts();
    return fromService.length > 0 ? fromService : this.cartProductsInput();
  });

  protected readonly isStoreSelected = computed(
    () => !!this.user()?.storeSelected,
  );

  /** Pure stock derivation — recalculates whenever user or cart changes. */
  protected readonly stockCheck = computed(() => {
    const user = this.user();
    const cart = this.cartProducts();
    if (!user?.storeSelected?.products) {
      return {
        allAvailable: true,
        unavailable: [] as CncCartItem[],
        total: 0,
      };
    }
    return this.cncService.checkCartStock(cart, user.storeSelected.products);
  });

  protected readonly allItemsAvailable = computed(
    () => this.stockCheck().allAvailable,
  );
  protected readonly cartItemUnavailable = computed(
    () => this.stockCheck().unavailable,
  );
  protected readonly grandTotal = computed(() => this.stockCheck().total);

  // ── Local mutable state (calendar / time slots) ────────────────
  protected readonly date = signal<Date | null>(null);
  protected readonly times = signal<number[]>([]);
  protected readonly selectedDayIndex = signal(-1);

  protected readonly calendar: Date[] = [];
  protected readonly days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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

    // Emit storeChanged when a new store is selected
    effect(() => {
      const store = this.cncService.selectedStore();
      if (store) {
        this.storeChanged.emit(store);
      }
    });

    // Emit stock-related outputs when derivation changes
    effect(() => {
      const user = this.user();
      if (!user?.storeSelected) return;
      const { total, allAvailable } = this.stockCheck();
      this.orderPrice.emit(total);
      this.isAllItemsAvailable.emit(allAvailable);
    });
  }

  // ── Actions ────────────────────────────────────────────────────
  protected onDaySelect(index: number, date: Date): void {
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

  protected onTimeSelected(time: number): void {
    this.timeSelected.emit(`${time}:00 - ${time + 1}:00`);
    this.expansionPanel()?.close();
  }

  protected onOpenDialog(): void {
    this.dialog.open(ProductAvailabilityComponent, {
      data: { call: 'checkout' },
    });
  }

  protected removeProductsUnavailable(): void {
    this.productsToRemove.emit(this.cartItemUnavailable());
    this.isAllItemsAvailable.emit(true);
  }

  protected selectStore(): void {
    this.router.navigate(['/storeselector']);
  }
}
