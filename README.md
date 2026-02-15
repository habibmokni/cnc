# @habibmokni/cnc

> **Click & Collect** Angular library — store selector, size picker, stock checks, and Google Maps integration for e-commerce apps.

[![Angular](https://img.shields.io/badge/Angular-21-dd0031)](https://angular.dev)
[![Material](https://img.shields.io/badge/Material-3-6750A4)](https://material.angular.io)
[![GitHub](https://img.shields.io/badge/GitHub-Package-181717)](https://github.com/habibmokni/cnc)

---

## Proof of concept

This library is consumed by [**iRun Shop**](https://github.com/habibmokni/iRun-Shop) — a running shoe e-commerce PWA built with Angular 21, Angular Material 3, and Firebase.

| | |
|---|---|
| **Live demo** | [irun-shop.web.app](https://irun-shop.web.app) |
| **Consumer repo** | [github.com/habibmokni/iRun-Shop](https://github.com/habibmokni/iRun-Shop) |
| **Library repo** | [github.com/habibmokni/cnc](https://github.com/habibmokni/cnc) |

iRun Shop uses the cnc library for store selection, size-based stock checking, product availability, and the full Click & Collect checkout flow. The two repos are designed to work together:

```
┌─────────────────────────────┐      ┌──────────────────────────┐
│  iRun Shop (consumer app)   │      │  @habibmokni/cnc (lib)   │
│                             │      │                          │
│  ShoeStore extends CncStore │─────▶│  CncStore                │
│  ShoeCartItem extends       │      │  CncCartItem             │
│    CncCartItem              │      │  CncUser                 │
│  ShoeUser extends CncUser   │      │  ClickNCollectService    │
│                             │      │  <cnc-store-selector>    │
│  Firebase (auth + data)     │      │  <cnc-size-selector>     │
│  Google Maps API key        │      │  <cnc-click-n-collect>   │
│  M3 theme (light + dark)    │      │  <cnc-maps>              │
└─────────────────────────────┘      └──────────────────────────┘
```

The library is **not** iRun-specific. It defines minimal interfaces and uses generics, so any e-commerce app (books, electronics, groceries) can plug in its own types.

---

## What's new in v2.1

| Area | Before | v2.1 |
|------|--------|------|
| Stock checks | Read from stale `user.storeSelected.products` | **Resolved from `stores` input** — always fresh data |
| Store selection | Flat list, no stock indicators | **Store cards with stock badges** (`In stock` / `Low stock` / `Unavailable`), "Change store" toggle |
| Date/Time picker | Custom day/time chips | **Material DatePicker + TimePicker** — weekday filter, 30-min intervals, opening-hours bounds |
| Unavailable items | Generic "not all available" message | **Per-item display** with image, name, size, and "Remove unavailable" action |
| Checkout summary | None | **Green confirmation banner** after store + date + time selection |
| Availability dialogs | No close button, broken search | **Close/back button**, "Use my location", **accordion steps** (size → store), **"Confirm store" button** |
| New component | — | **`<cnc-store-card>`** — reusable store card with stock badge, distance, selected state |
| `CncStore` type | No opening hours | Optional `openingTime?: { open: string; close: string }` |

### What's new in v2.0

| Area | v1 (Angular 12) | v2 (Angular 21) |
|------|-----------------|-----------------|
| Components | NgModule-based | **Standalone** components |
| State | `@Input` / `@Output` decorators | **Signals** (`input`, `output`, `signal`, `computed`) |
| DI | Constructor injection | **`inject()`** function |
| Change Detection | Default | **`OnPush`** everywhere |
| Layout | `@angular/flex-layout` | **CSS Flexbox** (no runtime dep) |
| Styling | Hard-coded colors | **Material 3 CSS custom properties** (`--mat-sys-*`) |
| Types | `any` everywhere | **Minimal interfaces + generics** — consumers `extends` with their own fields |
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

### 1. Import standalone components

```typescript
import {
  StoreSelectorComponent,
  SizeSelectorComponent,
  ClickNCollectComponent,
  StoreCardComponent,
} from '@habibmokni/cnc';

@Component({
  imports: [StoreSelectorComponent, SizeSelectorComponent, ClickNCollectComponent, StoreCardComponent],
  // ...
})
export class MyComponent {}
```

### 2. Define your types

The library exports minimal interfaces. Extend them with your domain-specific fields:

```typescript
import { CncStore, CncCartItem, CncUser, CncStoreProduct } from '@habibmokni/cnc';

// Your store extends the cnc contract with shop-specific fields
interface ShoeStore extends CncStore {
  openingTime: { open: string; close: string };
  reviews: string;
  rating: number;
}

// Your cart item extends with product details cnc doesn't need
interface ShoeCartItem extends CncCartItem {
  brand: string;
  category: 'men' | 'women' | 'kids';
  images: string[];
}

// Your user extends with profile fields cnc doesn't need
interface ShoeUser extends CncUser {
  firstName: string;
  lastName: string;
  email: string;
  wishlist: string[];
}
```

### 3. Bridge data via the service

```typescript
import { ClickNCollectService } from '@habibmokni/cnc';

export class AppComponent {
  private cncService = inject(ClickNCollectService) as ClickNCollectService<
    ShoeStore,
    ShoeCartItem,
    ShoeUser
  >;

  constructor() {
    this.cncService.setStoreList(stores);
    this.cncService.setStoreLocations(locations);
    this.cncService.setUser(user);
    this.cncService.setCartProducts(cartProducts);

    // Read the selected store reactively (signal, not Observable)
    effect(() => {
      const store = this.cncService.selectedStore();
      if (store) console.log('Store selected:', store);
    });
  }
}
```

> **Tip:** Create a typed injection helper to avoid repeating the assertion:
>
> ```typescript
> // inject-cnc.ts (in your app, not the library)
> export const injectCnc = () =>
>   inject(ClickNCollectService) as ClickNCollectService<ShoeStore, ShoeCartItem, ShoeUser>;
>
> // Then in any component:
> private cncService = injectCnc();
> ```

### 4. Use in templates

```html
<!-- Store selector page (map + address search) -->
<cnc-store-selector />

<!-- Size picker with stock awareness -->
<cnc-size-selector [product]="product" (sizeSelected)="onSize($event)" />

<!-- Full checkout flow (v2.1 — pass stores directly!) -->
<cnc-click-n-collect
  [stores]="stores"
  [cartProducts]="cart"
  [user]="user"
  (storeChanged)="onStore($event)"
  (dateSelected)="onDate($event)"
  (timeSelected)="onTime($event)"
  (productsToRemove)="onRemove($event)"
  (isAllItemsAvailable)="onAvailability($event)" />

<!-- Reusable store card (new in v2.1) -->
<cnc-store-card
  [store]="store"
  [selected]="isSelected"
  [stock]="stockLevel"
  [distance]="distanceKm"
  (storeSelect)="onSelect($event)" />
```

### 5. Google Maps

The consuming app must load the Google Maps JavaScript API (e.g. via a `<script>` tag in `index.html`):

```html
<script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
```

---

## Exported interfaces

The library defines **only the fields it needs**. Consumers extend with richer types.

| Interface | Fields | Purpose |
|-----------|--------|---------|
| `CncStore` | `id`, `name`, `address`, `location`, `products`, `openingTime?` | Store contract |
| `CncSelectedStore` | `id`, `name`, `address`, `products?` | Lightweight store ref on user |
| `CncStoreProduct` | `modelNo`, `variants` | In-store inventory item |
| `CncVariant` | `variantId`, `sizes`, `inStock` | Size/stock data per variant |
| `CncCartItem` | `modelNo`, `productName`, `productImage`, `price`, `size`, `noOfItems`, `variantId?` | Cart item for stock checks + display |
| `CncUser` | `storeSelected` | User contract (only store selection needed) |
| `CncNearbyStore<TStore>` | `store`, `distance`, `stock?` | Generic — preserves your store type |

```typescript
import {
  CncStore, CncStoreProduct, CncVariant, CncSelectedStore,
  CncCartItem, CncUser, CncNearbyStore,
} from '@habibmokni/cnc';
```

---

## Generic service

`ClickNCollectService` is generic on three type parameters, all defaulting to the minimal interfaces:

```typescript
class ClickNCollectService<
  TStore extends CncStore = CncStore,
  TCartItem extends CncCartItem = CncCartItem,
  TUser extends CncUser = CncUser,
>
```

This means:
- **Library components** work without generics (they only read base fields)
- **Consumers** get full type safety on their extended types
- **Any e-commerce domain** works — shoes, books, electronics, groceries

---

## Exported components

| Selector | Description |
|----------|-------------|
| `<cnc-click-n-collect>` | Main checkout flow — store cards with stock badges, Material DatePicker/TimePicker, unavailable items, summary banner |
| `<cnc-store-card>` | **New in v2.1** — Reusable store card with stock badge, distance, selected state |
| `<cnc-store-selector>` | Google Maps store picker with address autocomplete |
| `<cnc-size-selector>` | Size picker with per-store stock awareness |
| `<cnc-product-availability>` | Store availability dialog — close button, "Use my location", store cards, "Confirm store" |
| `<cnc-check-availability>` | Size-aware availability checker — accordion steps (size → store), address/map tabs, "Confirm store" |
| `<cnc-maps>` | Google Maps wrapper with markers, info windows, directions |

---

## Architecture (v2.1)

cnc is a **pure UI + logic plugin**. It:

- **Receives** ALL data via component inputs (`stores`, `cartProducts`, `user`)
- **Emits** ALL actions via outputs (`storeChanged`, `productsToRemove`, `dateSelected`, `timeSelected`)
- **Never** manages auth, writes to any database, or owns user/cart/store state
- The host app is the **single source of truth** — cnc adds Click & Collect UI on top

The `ClickNCollectService` is a lightweight **in-memory coordination layer** for sharing state between cnc's internal components (maps, store selector, size selector). Components feed it via inputs.

> **Key fix in v2.1:** Stock checks now resolve the full store from the `stores` input by ID — never from the potentially stale `user.storeSelected.products`.

---

## Theming

All components use Material 3 CSS custom properties. They automatically inherit the consuming app's theme:

```css
/* Components respond to these tokens */
--mat-sys-primary          /* interactive elements */
--mat-sys-on-primary       /* text on primary */
--mat-sys-tertiary         /* caution / low-stock indicators */
--mat-sys-error            /* out-of-stock / errors */
--mat-sys-surface-container
--mat-sys-on-surface       /* primary text */
--mat-sys-on-surface-variant /* secondary text */
--mat-sys-outline-variant  /* borders / dividers */
```

Both **light mode** and **dark mode** are supported out of the box. Zero hardcoded colors — every value is a `var(--mat-sys-*)` token with a sensible fallback.

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
