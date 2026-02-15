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
import { MatExpansionModule, MatExpansionPanel } from '@angular/material/expansion';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog } from '@angular/material/dialog';
import { ClickNCollectService } from '../clickNCollect.service';
import { ProductAvailabilityComponent } from '../productAvailability/productAvailability.component';
import { CncUser } from '../models/user.model';

@Component({
  selector: 'cnc-size-selector',
  standalone: true,
  imports: [
    CommonModule,
    MatExpansionModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './sizeSelector.component.html',
  styleUrl: './sizeSelector.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SizeSelectorComponent implements OnInit {
  private readonly cncService = inject(ClickNCollectService);
  private readonly dialog = inject(MatDialog);

  readonly expansionPanel = viewChild<MatExpansionPanel>('panel');

  // ── Inputs / Outputs ───────────────────────────────────────────
  readonly product = input<any>(null);
  readonly sizeSelected = output<number>();

  // ── Local state ────────────────────────────────────────────────
  readonly user = signal<CncUser | null>(null);
  readonly size = signal(0);
  readonly stock = signal(0);
  readonly isSizeSelected = signal(false);

  ngOnInit(): void {
    this.user.set(this.cncService.user());

    this.cncService.storeSelected.subscribe((store) => {
      const u = this.user();
      if (u) {
        this.cncService.setUser({ ...u, storeSelected: store });
        this.user.set(this.cncService.user());
      } else {
        this.cncService.setUser({ name: 'Anonymous', storeSelected: store } as any);
        this.user.set(this.cncService.user());
      }
      this.checkStockForCurrentSize();
    });
  }

  onSizeSelect(selectedSize: number, index: number, product: any): void {
    this.size.set(selectedSize);
    this.checkStockForCurrentSize();
    this.sizeSelected.emit(selectedSize);
    this.isSizeSelected.set(true);

    // If out of stock both online and in-store, open dialog
    if (+product.variants[0].instock[index] === 0 && this.stock() === 0) {
      this.openDialog(product);
    }
    this.expansionPanel()?.close();
  }

  openDialog(product: any): void {
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

  private checkStockForCurrentSize(): void {
    const u = this.user();
    const p = this.product();
    if (!u || !p) return;

    for (const storeProduct of u.storeSelected.products ?? []) {
      if (storeProduct.modelNo !== p.modelNo) continue;
      for (const variant of storeProduct.variants) {
        if (variant.variantId !== p.variants[0].variantId) continue;
        for (let i = 0; i < variant.sizes.length; i++) {
          if (variant.sizes[i] === this.size()) {
            this.stock.set(+variant.instock[i]);
            return;
          }
        }
      }
    }
  }
}
