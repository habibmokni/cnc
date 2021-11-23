# ClickNCollect

ClickNCollect is an angular library which helps to integrate clickNCollect feature to any e-commerce website.
This library was generated with [Angular CLI](https://github.com/angular/angular-cli) version 12.0.5.

# Click and Collect component

This component provides a click and collect solution for any e-commerce website. that implements the
[Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/tutorial).

## Installation

To install, run `npm install @habibmokni/cnc`.

## Prerequisite

Click and Collect library uses google maps api for displaying store lcoations on the map and also uses google maps places feature to get the user's enter location and then list the stores with shortest distance from that location.
So google maps api key is required. Follow following steps to get your own api key and integrate into your project.
- First follow [these steps](https://developers.google.com/maps/gmp-get-started) to get an API key that can be used to load Google Maps.
- Load the [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/tutorial#Loading_the_Maps_API).
- The Google Maps JavaScript API must be loaded before the `Click and Collect` component.

```html
<!-- index.html -->
<!doctype html>
<head>
  ...
  <script src="https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"></script>
</head>
```

**Note:**
If you want to learn more about how to use google maps api in any angular project you can jump to this guide [@angular/google-maps](https://github.com/angular/components/tree/master/src/google-maps)

## Activating the package

Complete clickNCollect package features are unlocked by importing the ClickNCollectModule as shown below. After importing the package you just have to add selectors to your html templates and clickNCollect features will be implemented in them. The <cnc-click-n-collect> selector is used for checkout. It provides the main click and collect logic. <cnc-size-selector> is used mainly in article/product page to get the product size and enable store selector if required. <cnc-store-selector> is used mainly used to give user a option to select a store preference. User can either select store by adding postal code/address or by selecting the a store from map. These are the three main features offered by click and collect package and are discussed in detail below.

```typescript
// clickandcollect-demo.module.ts

import { NgModule } from '@angular/core';
import { ClickNCollectModule } from '@habibmokni/cnc';
import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClientJsonpModule } from '@angular/common/http';

import { GoogleMapsDemoComponent } from './google-maps-demo.component';

@NgModule({
  declarations: [
    GoogleMapsDemoComponent,
  ],
  imports: [
    CommonModule,
    ClickNCollectModule,
    HttpClientModule,
    HttpClientJsonpModule,
  ],
  exports: [
    ClickAndCollectDemoComponent,
  ],
})
export class ClickAndCollectDemoModule {}


// google-maps-demo.component.ts

import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

@Component({
  selector: 'click-and-collect-demo',
  templateUrl: './click-n-collect.component.html',
})
export class GoogleMapsDemoComponent {
  //inject clickNCollect service and provide following data
  constructor(private cncService: ClickNCollectService) {
    this.cncService.setStoreList('your storeList'); //provide your store list here
    this.cncService.setCartProducts('your cart products'); //provide your cart products here
    this.cncService.setUser('your user'); //provide your user here
      
  }
```

```html
<!-- google-maps-demo.component.html -->

<div>
  <cnc-click-n-collect></cnc-click-n-collect>
</div>
```

## Components

- [`clickNCollect`](./)
- [`storeSelector`](./storeSelector)
- [`sizeSelector`](./sizeSelector)
- [`productAvailability`](./productAvailability)
- [`checkAvailability`](./checkAvailability)
- [`maps`](./maps)

## Services

- [`clickNCollect`](./)


## clickNCollect Component

The Click and collect components implement following options for their respective object:
- ['user'] - Click and collect requires a user object. This user object tells the clickNCollect component that which store is selected by the user and perform calculations accordingly.
- ['storeChanged'] - storeChanged event replies back the store changed by the user.
- ['productsToRemove'] - this event is trigered when there are unavailable items in cart and user wants to remove them. So it gets trigered.
- ['dateSelected'] - this event trigers when date is selected and returns the selected date
- ['timeSelected'] - this event trigers when time is selected and returns the selected time
- ['isAllItemsAvailable'] - this event get trigers automatically by clickNCollect component and is used to tell whether all items of cart are available or not
```html
<cnc-click-n-collect
        [user]="YourUser"
        (storeChanged)="YourMethod($event)"
        (productsToRemove)="YourMethod($event)"
        (dateSelected)="YourMethod($event)"
        (timeSelected)="YourMethod($event)"
        (isAllItemsAvailable)="YourMethod($event)"
      >
      </cnc-click-n-collect>
```

## storeSelector Component

This component of Click and collect is used to activate store selection feature. storeSelector provides an interface to the user to select the store from either list of stores by entering zip code/address or by google maps.

```html
<cnc-store-selector></cnc-store-selector>
```

## sizeSelector Component

This component of click and collect is used to activate size selection feature of click and collect. Size selector extends the features of storeSelector by providing extra details as product size and product variant and then providing the list of stores which has that product in stock.
- ['user'] - sizeSelector aslso requires a user object. This user object tells the clickNCollect component that which store is selected by the user and perform calculations accordingly.
- ['product'] - size selector requries a product object. Size selector compares this product with all the stores and check the stock and give results accordingly.
- ['sizeSelected'] - this event is trigered when user selects a size.

```html
<cnc-size-selector
        [user]="YourUser"
        [product]="userselectedproduct"
        (sizeSelected)="YourMethod($event)"
      >
      </cnc-size-selector>
```

**Note:**
All these options are required for proper functioning of click and collect feature as it needs a way to communicate with the application.

