import { Component, Inject, Input, NgZone, OnInit } from '@angular/core';
import { MatDialog, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ClickNCollectService } from '../click-n-collect.service';

@Component({
  selector: 'cnc-check-availability',
  templateUrl: './check-availability.component.html',
  styleUrls: ['./check-availability.component.css']
})
export class CheckAvailabilityComponent implements OnInit {


  nearByStores: {stores: any, distances: number, stock: number}[] =[];
  productAvailabilty: string[] = [];
  @Input() stores: any[] = [];
  size=0;
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
        const container = document.querySelector('.pac-container') as HTMLElement;
        if(container){
          console.log('found container');
          container.style.top = '750px';
        }
        //set latitude, longitude and zoom
        let latitude = place.geometry.location.lat();
        let longitude = place.geometry.location.lng();
        let zoom = 12;

        console.log(latitude + "longitude" + longitude);

          this.cncService.find_closest_marker(latitude, longitude);
          setTimeout(() => {
            this.checkProductAvailabilty(this.data.modelNo,this.size, this.data.variantId);
          }, 100);

        console.log(this.nearByStores);
      });
    });

    },500);


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
              console.log("model true");
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
                    console.log(this.nearByStores);
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


    checkAllProductsAvailabilty(cartProducts: any[]){
      let i=0;
      let isAvailable = 0;
        for(let store of this.stores){
          console.log('store changed');

            //yahan products ki for loop use karni h
            for(let product of store.products){
              for(let a=0; a<cartProducts.length; a++){
                if(product.modelNo === cartProducts[a].modelNo){

                  for(let variant of product.variants){
                    if(variant.variantId === cartProducts[a].variantId){
                      for(let index=0; index<variant.sizes.length; index++){

                        if(variant.sizes[index] === cartProducts[a].size && +variant.inStock[index] >= cartProducts[a].noOfItems!){
                          isAvailable = 10;
                          console.log('product found with all the requirements');

                       }
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
            this.nearByStores.push({
              stores: store,
              stock: isAvailable,
              distances: this.cncService.distanceInKm[i]
            });
            this.nearByStores.sort((a,b)=> a.distances-b.distances);
            i++;
          }

      }

      changeSize(size: any){
        if(this.nearByStores){
         this.nearByStores = [];
        }
        this.size = size;
        this.isSizeSelected = true;
      }

    currentLocation(){
      this.cncService.getCurrentLocation();
      setTimeout(()=>{
        this.nearByStores = [];
        this.checkProductAvailabilty(this.data.modelNo,this.size, this.data.variantId);
      },1000)

    }

}
