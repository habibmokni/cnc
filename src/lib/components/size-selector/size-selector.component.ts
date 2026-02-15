import {
  Component,
  ChangeDetectionStrategy,
  computed,
  inject,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  MatExpansionModule,
  MatExpansionPanel,
} from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { ClickNCollectService } from '../../services/click-n-collect.service';
import { ProductAvailabilityComponent } from '../product-availability/product-availability.component';
import { CncStoreProduct } from '../../types/store.type';

@Component({
  selector: 'cnc-size-selector',
  standalone: true,
  imports: [
    MatExpansionModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './size-selector.component.html',
  styleUrl: './size-selector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SizeSelectorComponent {
  private readonly cncService = inject(ClickNCollectService);
  private readonly dialog = inject(MatDialog);

  private readonly expansionPanel =
    viewChild<MatExpansionPanel>('panel');

  // ── Inputs / Outputs ───────────────────────────────────────────
  public readonly product = input<CncStoreProduct | null>(null);
  public readonly sizeSelected = output<number>();

  // ── Local state ────────────────────────────────────────────────
  protected readonly size = signal(0);
  protected readonly isSizeSelected = signal(false);

  // ── Derived ────────────────────────────────────────────────────
  protected readonly user = computed(() => this.cncService.user());

  /** Reactive stock count — recalculates when user or size changes. */
  protected readonly stock = computed(() => {
    const u = this.user();
    const p = this.product();
    const s = this.size();
    if (!u?.storeSelected?.products || !p || s === 0) return 0;
    return this.cncService.findStockForSize(
      u.storeSelected.products,
      p.modelNo,
      p.variants[0].variantId,
      s,
    );
  });

  // ── Actions ────────────────────────────────────────────────────
  protected onSizeSelect(
    selectedSize: number,
    index: number,
    product: CncStoreProduct,
  ): void {
    this.size.set(selectedSize);
    this.sizeSelected.emit(selectedSize);
    this.isSizeSelected.set(true);

    if (+product.variants[0].instock[index] === 0 && this.stock() === 0) {
      this.openDialog(product);
    }
    this.expansionPanel()?.close();
  }

  protected openDialog(product: CncStoreProduct): void {
    if (!this.isSizeSelected()) return;
    this.dialog.open(ProductAvailabilityComponent, {
      data: {
        call: 'size-selector',
        size: this.size(),
        modelNo: product.modelNo,
        sizes: product.variants[0].sizes,
        variantId: product.variants[0].variantId,
      },
      maxWidth: '100vw',
      maxHeight: '100vh',
    });
  }
}
