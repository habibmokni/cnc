import { Component, ElementRef, EventEmitter, Inject, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClickNCollectService } from '../clickNCollect.service';

@Component({
  selector: 'cnc-store-availability',
  templateUrl: './storeAvailability.component.html',
  styleUrls: ['./storeAvailability.component.css']
})
export class StoreAvailabilityComponent implements OnInit {
  //accessing instance of search element from Dom
  @ViewChild('search') address!: ElementRef;

  nearByStores: {stores: any, distances: number, stock: number}[] =[];

  stores: any[] = [];
  @Input() sizeAndModel: {size: number, modelNo: string} = {size:0, modelNo:''};
  cartProducts: any[] = [];
  @Output() selectedStore= new EventEmitter<any>();
  user: any;
  isSizeSelected = false;

  constructor(
    private ngZone: NgZone,
    private cncService: ClickNCollectService,
    private dialog: MatDialog,
    @Inject(MAT_DIALOG_DATA) public data: any
    ) {
      this.stores = cncService.getStoreList();
      this.cartProducts = cncService.getCartProducts();
     }

  ngOnInit(): void {
    const sizeAndModelSelected = this.sizeAndModel;

    setTimeout(()=>{
      const input= document.getElementById("search") as HTMLInputElement;
      const autocomplete = new google.maps.places.Autocomplete(input);
      //google autoComplete listner
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
          //if called by product page
          if(this.data.call === "product"){
            this.cncService.find_closest_marker(latitude, longitude);
            setTimeout(() => {
              this.checkProductAvailabilty(sizeAndModelSelected.modelNo,sizeAndModelSelected.size, this.data.variantId);
            }, 500);
          }
          //if called by size-selector
          if(this.data.call === "size-selector"){
            this.cncService.find_closest_marker(latitude, longitude);
            setTimeout(() => {
              this.checkProductAvailabilty(this.data.modelNo,this.data.size, this.data.variantId);
            }, 500);
          }
          //if called by checkout
          if(this.data.call === "checkout"){
            this.cncService.find_closest_marker(latitude, longitude);
            setTimeout(() => {
              console.log(this.cartProducts);
              this.checkAllProductsAvailabilty(this.cartProducts);
            },500);
          }
          console.log(this.nearByStores);
        });
      });
    },1000);
    //options to style the map and if we want to restrict only to a specific country
    const options= {
      fields: ["formatted_address", "geometry", "name"],
      strictBounds: false,
      types: ["establishment"]
    };
  }
  //to check single product availability
  checkProductAvailabilty(modelNo: string, productSize: number, variantId: string){
    let i=0;
    //looping stores
    for(let store of this.stores){
      //looping products of each store
      for(let product of store.products){
        //if model matches
        if(product.modelNo === modelNo){
          //looping variants
          for(let variant of product.variants){
            if(variant.variantId === variantId){        //if variant of product matches
              for(let index=0; index<variant.sizes.length; index++){
                //if size matches
                if(+variant.sizes[index] === +productSize){ //(+) sign to ensure string is not used for comparison
                  this.nearByStores.push({
                    stores: store,
                    stock: +variant.inStock[index],
                    distances: this.cncService.distanceInKm[i]
                  });
                }
                //sorting with shortest distance first
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
  //runs with every store selection
  onStoreSelect(store: any){
    //if user exists then store updated
    if(this.user){
      this.user.storeSelected = store;
    }else{
      //if user does not exist then new user created
      this.cncService.setUser({
        name: 'Anonymous',
        storeSelected: store
      });
      this.user = this.cncService.getUser();
    }
    this.cncService.storeSelected.next(store);
    this.dialog.closeAll();
  }
  //to check each pproduct of cart in all stores
  checkAllProductsAvailabilty(cartProducts: any[]){
    let i=0;
    let isAvailable = 0;
    //looping each store
    for(let store of this.stores){
      isAvailable = 10  //just a check if 10 all products available if zero not all available
      //looping each product of store
      for(let product of store.products){
        //looping cart products
        for(let a=0; a<cartProducts.length; a++){
          //if modelNo matches then go forward
          if(product.modelNo === cartProducts[a].modelNo && isAvailable>0){  //isAvailable indicates that if not available is zero then no need to proceed
            //looping each variant
            for(let variant of product.variants){
              //checking if variantId matches
              if(variant.variantId === cartProducts[a].variantId){
                //looping through sizes
                for(let index=0; index<variant.sizes.length; index++){
                  //if size match is stock limit of product does not exceeds
                  if(+variant.sizes[index] === cartProducts[a].size && +variant.inStock[index] >= cartProducts[a].noOfItems){
                    isAvailable = 10;
                    console.log('product found with all the requirements' + +variant.inStock[index]);
                  }
                  //if size matches and limit exceeds
                  if(+variant.sizes[index] === cartProducts[a].size && +variant.inStock[index] < cartProducts[a].noOfItems){
                    isAvailable = 0;
                    console.log('no of items in cart exceed no of items available'+ +variant.inStock[index]) ;
                  }
                }
              }
            }
          }
        }
      }
      //pushing store if all conditions met
      this.nearByStores.push({
        stores: store,
        stock: isAvailable,
        distances: this.cncService.distanceInKm[i]
      });
      this.nearByStores.sort((a,b)=> a.distances-b.distances);
      i++;
    }
  }

}
