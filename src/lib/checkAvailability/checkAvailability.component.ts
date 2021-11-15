import { Component, Inject, Input, NgZone, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClickNCollectService } from '../clickNCollect.service';

@Component({
  selector: 'cnc-check-availability',
  templateUrl: './checkAvailability.component.html',
  styleUrls: ['./checkAvailability.component.css']
})
export class CheckAvailabilityComponent implements OnInit {


  nearByStores: {stores: any, distances: number, stock: number}[] =[];
  productAvailabilty: string[] = [];
  @Input() stores: any[] = [];
  size=0;
  cartProducts: any[] = [];
  isSizeSelected = false;

  constructor(
    private ngZone: NgZone,
    private cncService: ClickNCollectService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
    ) {
      this.stores = cncService.getStoreList();
    }

  ngOnInit(): void {
    if(this.data.size){
      this.size = this.data.size;
      this.isSizeSelected = true;
    }

    setTimeout(()=>{
      //accessing input search element
      const input= document.getElementById("search") as HTMLInputElement;
      //google autocomplete search linking with input
      const autocomplete = new google.maps.places.Autocomplete(input);
      //listening to changes in place
      autocomplete.addListener("place_changed", () => {
        this.ngZone.run(() => {
          this.nearByStores= [];
          //get the place result
          let place: google.maps.places.PlaceResult = autocomplete.getPlace();
          //verify result
          if (place.geometry === undefined || place.geometry === null) {
            return;
          }
          //set latitude, longitude and zoom
          let latitude = place.geometry.location.lat();
          let longitude = place.geometry.location.lng();
          let zoom = 12;
          //finding closest stores
          this.cncService.find_closest_marker(latitude, longitude);
          setTimeout(() => {
            this.checkProductAvailabilty(this.data.modelNo,this.size, this.data.variantId);
          }, 100);
          console.log(this.nearByStores);
        });
      });
    },500);
  }
  //check for single product availability
  checkProductAvailabilty(modelNo: string, productSize: number, variantId: string){
    let i=0;
    //looping stores
    for(let store of this.stores){
      //looping products of each store
      for(let product of store.products){
        //if modelNo matches
        if(product.modelNo === modelNo){
          //looping variants of product
          for(let variant of product.variants){
            //if variant matches
            if(variant.variantId === variantId){
              //looping sizes
              for(let index=0; index<variant.sizes.length; index++){
                if(+variant.sizes[index] === +productSize){ // + sign is to ensure number type
                  this.nearByStores.push({
                    stores: store,
                    stock: +variant.inStock[index],
                    distances: this.cncService.distanceInKm[i]
                  });
                  console.log(this.nearByStores);
                }
                //sorting with shortest distance
                this.nearByStores.sort((a,b)=> a.distances-b.distances)
              }
            }
          }
        }
      }
      i++;
    }
    console.log(this.nearByStores);
  }

  //checks if all cart products are in the store or not
  checkAllProductsAvailabilty(cartProducts: any[]){
    let i=0;
    let isAvailable = 0;
    //looping through stores
    for(let store of this.stores){
    console.log('store changed');
    //looping each product of store
      for(let product of store.products){
        //looping cart products
        for(let a=0; a<cartProducts.length; a++){
          //matching product modelNo
          if(product.modelNo === cartProducts[a].modelNo){
            for(let variant of product.variants){
              //matching variants
              if(variant.variantId === cartProducts[a].variantId){
                for(let index=0; index<variant.sizes.length; index++){
                  //if size matches and variant stock does not exceed store stock limit
                  if(variant.sizes[index] === cartProducts[a].size && +variant.inStock[index] >= cartProducts[a].noOfItems!){
                    isAvailable = 10;
                    console.log('product found with all the requirements');
                  }
                  //if size matches and variant stock does exceeds store stock limit
                  if(variant.sizes[index] === cartProducts[a].size && +variant.inStock[index] <= cartProducts[a].noOfItems!){
                    isAvailable = 0;
                    console.log('no of items in cart exceed no of items available');
                  }
                }
              }
            }
          }
        }
      }
      //pushing store to nearbyStores
      this.nearByStores.push({
        stores: store,
        stock: isAvailable,
        distances: this.cncService.distanceInKm[i]
      });
      //sorting with shortest distance
      this.nearByStores.sort((a,b)=> a.distances-b.distances);
      i++;
    }
  }
  //if user wants to change size
  changeSize(size: any){
    if(this.nearByStores){
     this.nearByStores = [];
    }
    this.size = size;
    this.isSizeSelected = true;
  }
  //get user current Location
  currentLocation(){
    this.cncService.getCurrentLocation();
    setTimeout(()=>{
      this.nearByStores = [];
      this.checkProductAvailabilty(this.data.modelNo,this.size, this.data.variantId);
    },1000)
  }

}
