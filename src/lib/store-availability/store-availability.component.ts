import { Component, ElementRef, EventEmitter, Inject, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClickNCollectService } from '../click-n-collect.service';

@Component({
  selector: 'cnc-store-availability',
  templateUrl: './store-availability.component.html',
  styleUrls: ['./store-availability.component.css']
})
export class StoreAvailabilityComponent implements OnInit {
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

        console.log(latitude + "longitude" + longitude);

        if(this.data.call === "product"){
          this.cncService.find_closest_marker(latitude, longitude);
          setTimeout(() => {
            this.checkProductAvailabilty(sizeAndModelSelected.modelNo,sizeAndModelSelected.size, this.data.variantId);
          }, 500);
        }
        if(this.data.call === "size-selector"){
          this.cncService.find_closest_marker(latitude, longitude);
          setTimeout(() => {
            this.checkProductAvailabilty(this.data.modelNo,this.data.size, this.data.variantId);
          }, 500);
        }
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


    const options= {
      fields: ["formatted_address", "geometry", "name"],
      strictBounds: false,
      types: ["establishment"]
    };


  }

  checkProductAvailabilty(modelNo: string, productSize: number, variantId: string){
    let i=0;

      for(let store of this.stores){
        console.log(store);
          //yahan products ki for loop use karni h
          for(let product of store.products){
            if(product.modelNo === modelNo){
              console.log('model matched');
              for(let variant of product.variants){
                if(variant.variantId === variantId){
                  console.log('variant matched');
                  for(let index=0; index<variant.sizes.length; index++){

                    if(+variant.sizes[index] === +productSize){
                      console.log(variant.sizes[index]);
                      this.nearByStores.push({
                        stores: store,
                        stock: +variant.inStock[index],
                        distances: this.cncService.distanceInKm[i]
                      });
                   }
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



    onStoreSelect(store: any){
      if(this.user){
        this.user.storeSelected = store;
      }else{
        this.cncService.setUser({
          name: 'Anonymous',
          storeSelected: store
        });
        this.user = this.cncService.getUser();
      }
      this.cncService.storeSelected.next(store);
      this.dialog.closeAll();
    }

    checkAllProductsAvailabilty(cartProducts: any[]){
      let i=0;
      let isAvailable = 0;
        for(let store of this.stores){
          console.log('store changed');
          isAvailable = 10
            //yahan products ki for loop use karni h
            for(let product of store.products){
              for(let a=0; a<cartProducts.length; a++){
                if(product.modelNo === cartProducts[a].modelNo && isAvailable>0){
                  for(let variant of product.variants){
                    if(variant.variantId === cartProducts[a].variantId){
                      for(let index=0; index<variant.sizes.length; index++){

                        if(+variant.sizes[index] === cartProducts[a].size && +variant.inStock[index] >= cartProducts[a].noOfItems){
                          isAvailable = 10;
                          console.log('product found with all the requirements' + +variant.inStock[index]);
                        }
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
