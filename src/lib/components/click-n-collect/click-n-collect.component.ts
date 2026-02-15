import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  signal,
  viewChild,
  OnInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { ClickNCollectService } from '../../services/click-n-collect.service';
import { ProductAvailabilityComponent } from '../product-availability/product-availability.component';
import { CartProduct } from '../../types/cart.type';
import { Store } from '../../types/store.type';
import { CncUser } from '../../types/user.type';

@Component({
  selector: 'cnc-click-n-collect',
  standalone: true,
  imports: [
    CommonModule,
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
export class ClickNCollectComponent implements OnInit {
  private readonly router = inject(Router);
  private readonly dialog = inject(MatDialog);
  private readonly cncService = inject(ClickNCollectService);

  readonly expansionPanel = viewChild<MatExpansionPanel>('timePanel');

  // ── Inputs ─────────────────────────────────────────────────────
  readonly cartProductsInput = input<CartProduct[]>([], { alias: 'cartProducts' });
  readonly storesInput = input<Store[]>([], { alias: 'stores' });
  readonly userInput = input<CncUser | null>(null, { alias: 'user' });
  readonly storeLocationsInput = input<google.maps.LatLngLiteral[]>([], { alias: 'storeLocations' });

  // ── Outputs ────────────────────────────────────────────────────
  readonly dateSelected = output<Date>();
  readonly productsToRemove = output<CartProduct[]>();
  readonly orderPrice = output<number>();
  readonly timeSelected = output<string>();
  readonly storeChanged = output<Store>();
  readonly isAllItemsAvailable = output<boolean>();

  // ── Local state ────────────────────────────────────────────────
  readonly user = signal<CncUser | null>(null);
  readonly cartProducts = signal<CartProduct[]>([]);
  readonly allItemsAvailable = signal(true);
  readonly isStoreSelected = signal(false);
  readonly cartItemUnavailable = signal<CartProduct[]>([]);
  readonly grandTotal = signal(0);
  readonly date = signal<Date | null>(null);
  readonly times = signal<number[]>([]);

  readonly calendar: Date[] = [];
  readonly days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  readonly selectedDayIndex = signal(-1);

  private currentTime: number;

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
  }

  ngOnInit(): void {
    this.cartProducts.set(
      this.cncService.cartProducts().length > 0
        ? this.cncService.cartProducts()
        : this.cartProductsInput(),
    );
    this.user.set(this.cncService.user() ?? this.userInput());

    this.cncService.storeSelected.subscribe((store) => {
      this.storeChanged.emit(store);
      const u = this.user();
      if (u) {
        const updated = { ...u, storeSelected: store };
        this.user.set(updated);
      }
      this.recheckStock();
    });

    if (this.user()) {
      this.isStoreSelected.set(true);
      this.recheckStock();
    }
  }

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
    const newTimes: number[] = [];
    const start = date.toDateString() === now.toDateString() ? this.currentTime + 1 : 10;
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
    this.allItemsAvailable.set(true);
    this.productsToRemove.emit(this.cartItemUnavailable());
    this.isAllItemsAvailable.emit(true);
  }

  selectStore(): void {
    this.router.navigate(['/storeselector']);
  }

  // ── Stock check ────────────────────────────────────────────────
  private recheckStock(): void {
    const u = this.user();
    const cart = this.cartProducts();
    if (!u?.storeSelected?.products) return;

    const unavailable: CartProduct[] = [];
    let total = 0;
    const itemInStock: number[] = [];

    for (const product of cart) {
      let found = false;
      for (const sp of u.storeSelected.products) {
        if (sp.modelNo !== product.modelNo) continue;
        for (const variant of sp.variants) {
          if (variant.variantId !== product.variantId) continue;
          for (let i = 0; i < variant.sizes.length; i++) {
            if (+variant.sizes[i] === product.size) {
              itemInStock.push(+variant.instock[i]);
              found = true;
            }
          }
        }
      }
      if (!found) itemInStock.push(0);
      total += product.price * product.noOfItems;
    }

    const bad: CartProduct[] = [];
    let allAvailable = true;
    for (let i = 0; i < itemInStock.length; i++) {
      if (itemInStock[i] === 0) {
        allAvailable = false;
        bad.push(cart[i]);
      }
    }

    this.cartItemUnavailable.set(bad);
    this.allItemsAvailable.set(allAvailable);
    this.grandTotal.set(total);
    this.orderPrice.emit(total);
    if (!allAvailable) {
      this.isAllItemsAvailable.emit(false);
    }
  }
}
