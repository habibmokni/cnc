import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MapInfoWindow, MapMarker } from '@angular/google-maps';
import { MatDialog } from '@angular/material/dialog';
import { Observable} from 'rxjs';
import { ClickNCollectService } from '../click-n-collect.service';


@Component({
  selector: 'cnc-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent implements OnInit {
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow ;
  @Input() mapHeight: number= 450;
  @Input() mapWidth: number= screen.width;
  @Input() modelNo: any;
  @Input() size: number = 0;
  @Input() variantId: string = '';

  @Input() cartProducts: any[] = [];

  styleArray: google.maps.MapTypeStyle[] =
    [
      {
        "featureType": "administrative",
        "elementType": "all",
        "stylers": [
            {
                "visibility": "simplified"
            }
        ]
      },
      {
        "featureType": "landscape",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "simplified"
            },
            {
                "color": "#fcfcfc"
            }
        ]
      },
      {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "simplified"
            },
            {
                "color": "#fcfcfc"
            }
        ]
      },
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "simplified"
            },
            {
                "color": "#dddddd"
            }
        ]
      },
      {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "simplified"
            },
            {
                "color": "#dddddd"
            }
        ]
      },
      {
        "featureType": "road.local",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "simplified"
            },
            {
                "color": "#eeeeee"
            }
        ]
      },
      {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [
            {
                "visibility": "simplified"
            },
            {
                "color": "#dddddd"
            }
        ]
      }
    ]

  options: google.maps.MapOptions = {
    center: {lat: 51.44157584725519, lng: 7.565725496333208},
    zoom: 8,
    styles: this.styleArray
  };

  markerOptions: google.maps.MarkerOptions = {
    draggable: false,
    animation: google.maps.Animation.DROP
  };

  user: any;
  currentStore: any;
  //storeLocations: {lat: number, lng: number}[];
  storeList : any[] = [];

  currentLocation: google.maps.LatLngLiteral = { lat: 51.44157584725519, lng: 7.565725496333208};
  logo="../../assets/images/logos/location.png";
  icon = {
    url: "https://fonts.google.com/icons?selected=Material%20Icons%20Outlined%3Awhere_to_vote%3A", // url
};

  directionsResults$!: Observable<google.maps.DirectionsResult|undefined>;

  storeLocations: google.maps.LatLngLiteral[];

  constructor(
    private cncService: ClickNCollectService,
    private dialog: MatDialog
    ){
      //console.log(this.storeLocations);
      this.storeLocations = this.cncService.getStoreLocations();
      console.log(this.storeLocations);
    }
  ngOnInit(): void {
    this.storeList = this.cncService.getStoreList();
    this.user = this.cncService.getUser();
    this.currentStore = this.storeList[0];
    if(this.size>0){
      this.checkProductAvailabilty(this.modelNo, this.size, this.variantId)
    }else{
      if(this.cartProducts.length>0){
        this.checkAllProductsAvailabilty(this.cartProducts);
      }
    }



  }
  currentUserLocation: google.maps.LatLngLiteral = { lat: 31.4914, lng: 74.2385};

  onGetCurrentLocation(){
    this.cncService.getCurrentLocation()
    setTimeout(()=>{
      this.options = {
        center: this.cncService.currentLocation
      };
      this.currentUserLocation = this.cncService.currentLocation;
    },500)

  }
  onGetDirections(location: any){
    this.cncService.getDirections(location);
    this.directionsResults$ = this.cncService.storeDirectionsResults$;
    this.options.zoom=2;
  }
  openInfoWindow(marker: MapMarker, store: any, event: google.maps.MapMouseEvent) {
    this.currentStore = store;
    console.log(this.currentStore.name);
    this.infoWindow.open(marker);
    this.cncService.currentStoreLocation = event.latLng.toJSON();
  }
  onStoreSelect(store: any){
    if(this.user){
      this.cncService.storeSelected.next(store);
    }else {
      this.cncService.setUser({
        name: 'Anonymous',
        storeSelected: store
      })
      this.cncService.storeSelected.next(store);
    }

    this.infoWindow.close();
    this.dialog.closeAll();
  }
  checkProductAvailabilty(modelNo: string, productSize: number,  variantId: string){
    let i=0;
    console.log(this.storeList)
    let newLocations = [];
      for(let store of this.storeList){
        console.log(store);
          //yahan products ki for loop use karni h
          for(let product of store.products){
            if(product.modelNo === modelNo){
              console.log("model true");
              for(let variant of product.variants){
                if(variant.variantId === variantId){
                  for(let index=0; index<variant.sizes.length; index++){
                    console.log(productSize);
                    if(+variant.sizes[index] === +productSize && +variant.inStock[index]>0){
                      console.log(variant.sizes[index]);
                      newLocations.push(this.storeLocations[i]);
                      console.log(newLocations);
                   }
                  }
                }

              }
            }

          }
          i++;
        }
        this.storeLocations = newLocations;
    }

    checkAllProductsAvailabilty(cartProducts: any[]){
      let i=0;
      let newLocations: google.maps.LatLngLiteral[] = [];
      let allProducts = 0;
        for(let store of this.storeList){
          console.log('maps store');
          allProducts = 0;
            //yahan products ki for loop use karni h
            for(let product of store.products){
              for(let a=0; a<cartProducts.length; a++){

                if(product.modelNo === cartProducts[a].modelNo){
                  console.log('map model match');
                  for(let variant of product.variants){
                    if(variant.variantId === cartProducts[a].variantId){
                      for(let index=0; index<variant.sizes.length; index++){

                        if(+variant.sizes[index] === cartProducts[a].size && +variant.inStock[index] >= cartProducts[a].noOfItems){
                          allProducts++;
                          console.log('this is stock of cart products' + cartProducts[a].noOfItems + 'variant' + variant.inStock[index]);
                          console.log(allProducts);
                       }
                      }
                    }
                  }
                }
              }
            }
            console.log(allProducts);
            if(allProducts === cartProducts.length){
              newLocations.push(this.storeLocations[i]);
              console.log(newLocations);
            }


            i++;
          }
          this.storeLocations = newLocations;
      }


}
