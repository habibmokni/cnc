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
import { CncStoreProduct, CncVariant } from '../../types/store.type';

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

  public readonly product = input<CncStoreProduct | null>(null);
  public readonly sizeSelected = output<number>();

  protected readonly size = signal(0);
  protected readonly isSizeSelected = signal(false);

  protected readonly user = computed(() => this.cncService.user());

  protected readonly firstVariant = computed<CncVariant | null>(() => {
    const product = this.product();
    return product?.variants?.[0] ?? null;
  });

  protected readonly stock = computed(() => {
    const user = this.user();
    const product = this.product();
    const variant = this.firstVariant();
    const selectedSize = this.size();
    if (!user?.storeSelected?.products || !product || !variant || selectedSize === 0) return 0;
    return this.cncService.findStockForSize(
      user.storeSelected.products,
      product.modelNo,
      variant.variantId,
      selectedSize,
    );
  });

  protected onSizeSelect(
    selectedSize: number,
    index: number,
    variant: CncVariant,
    product: CncStoreProduct,
  ): void {
    this.size.set(selectedSize);
    this.sizeSelected.emit(selectedSize);
    this.isSizeSelected.set(true);

    if (+variant.instock[index] === 0 && this.stock() === 0) {
      this.openDialog(product);
    }
    this.expansionPanel()?.close();
  }

  protected openDialog(product: CncStoreProduct): void {
    const variant = this.firstVariant();
    if (!this.isSizeSelected() || !variant) return;
    this.dialog.open(ProductAvailabilityComponent, {
      data: {
        call: 'size-selector',
        size: this.size(),
        modelNo: product.modelNo,
        sizes: variant.sizes,
        variantId: variant.variantId,
      },
      maxWidth: '100vw',
      maxHeight: '100vh',
    });
  }
}
