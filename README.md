# @habibmokni/cnc

> **Click & Collect** Angular library — store selector, size picker, stock checks, and Google Maps integration for e-commerce apps.

[![Angular](https://img.shields.io/badge/Angular-21-dd0031)](https://angular.dev)
[![Material](https://img.shields.io/badge/Material-3-6750A4)](https://material.angular.io)

---

## What's new in v2

| Area | v1 (Angular 12) | v2 (Angular 21) |
|------|-----------------|-----------------|
| Components | NgModule-based | **Standalone** components |
| State | `@Input` / `@Output` decorators | **Signals** (`input`, `output`, `signal`, `computed`) |
| DI | Constructor injection | **`inject()`** function |
| Change Detection | Default | **`OnPush`** everywhere |
| Layout | `@angular/flex-layout` | **CSS Flexbox** (no runtime dep) |
| Styling | Hard-coded colors | **Material 3 CSS custom properties** (`--mat-sys-*`) |
| Types | `any` everywhere | **Typed models** (`Store`, `CncUser`, `CartProduct`, etc.) |
| Maps | Bundled Google Maps JS | **`@angular/google-maps` v21** (consumer loads API) |

---

## Installation

```bash
npm install @habibmokni/cnc
```

### Peer dependencies

```
@angular/core         ^21.0.0
@angular/common       ^21.0.0
@angular/forms        ^21.0.0
@angular/router       ^21.0.0
@angular/material     ^21.0.0
@angular/cdk          ^21.0.0
@angular/google-maps  ^21.0.0
```

---

## Quick start

### 1. Import the module (backward-compatible)

```typescript
import { ClickNCollectModule } from '@habibmokni/cnc';

bootstrapApplication(AppComponent, {
  providers: [importProvidersFrom(ClickNCollectModule)],
});
```

**Or** import standalone components directly:

```typescript
import { StoreSelectorComponent, SizeSelectorComponent } from '@habibmokni/cnc';

@Component({
  imports: [StoreSelectorComponent, SizeSelectorComponent],
  // ...
})
export class MyComponent {}
```

### 2. Bridge data via the service

```typescript
import { ClickNCollectService } from '@habibmokni/cnc';

export class AppComponent {
  private cncService = inject(ClickNCollectService);

  ngOnInit() {
    this.cncService.setStoreList(stores);
    this.cncService.setStoreLocations(locations);
    this.cncService.setUser(user);
    this.cncService.setCartProducts(cartProducts);

    this.cncService.storeSelected.subscribe(store => {
      console.log('Store selected:', store);
    });
  }
}
```

### 3. Use in templates

```html
<!-- Store selector page (map + address search) -->
<cnc-store-selector />

<!-- Size picker with stock awareness -->
<cnc-size-selector [product]="product" (sizeSelected)="onSize($event)" />

<!-- Full checkout flow -->
<cnc-click-n-collect
  [user]="user"
  [cartProducts]="cart"
  (dateSelected)="onDate($event)"
  (timeSelected)="onTime($event)"
  (storeChanged)="onStore($event)" />
```

### 4. Google Maps

The consuming app must load the Google Maps JavaScript API (e.g. via a `<script>` tag in `index.html`):

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
```

---

## Exported components

| Selector | Description |
|----------|-------------|
| `<cnc-click-n-collect>` | Main checkout flow (store + date/time picker + stock checks) |
| `<cnc-store-selector>` | Google Maps store picker with address autocomplete |
| `<cnc-size-selector>` | Size picker with per-store stock awareness |
| `<cnc-product-availability>` | Store availability dialog |
| `<cnc-check-availability>` | Size-aware availability checker dialog |
| `<cnc-maps>` | Google Maps wrapper with markers, info windows, directions |

---

## Models

```typescript
import { Store, CncUser, CartProduct, NearbyStore } from '@habibmokni/cnc';
```

See `src/lib/models/` for full type definitions.

---

## Theming

All components use Material 3 CSS custom properties. They automatically inherit the consuming app's theme:

```css
/* Components respond to these tokens */
--mat-sys-primary
--mat-sys-on-primary
--mat-sys-surface-container
--mat-sys-on-surface
--mat-sys-on-surface-variant
--mat-sys-error
```

Both **light mode** and **dark mode** are supported out of the box.

---

## Building

```bash
npm run build          # development build
npm run build:prod     # production build (partial compilation)
```

Output is written to `dist/`.

---

## License

MIT
