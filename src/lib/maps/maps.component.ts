import { Component, Input, OnInit, ViewChild } from '@angular/core';
import { MapInfoWindow, MapMarker } from '@angular/google-maps';
import { MatDialog } from '@angular/material/dialog';
import { Observable} from 'rxjs';
import { ClickNCollectService } from '../clickNCollect.service';


@Component({
  selector: 'cnc-maps',
  templateUrl: './maps.component.html',
  styleUrls: ['./maps.component.css']
})
export class MapsComponent implements OnInit {
  //instance of MapInfoWindow
  @ViewChild(MapInfoWindow) infoWindow!: MapInfoWindow ;
  //if user wants to set maps height and width
  @Input() mapHeight: number= 450;
  @Input() mapWidth: number= screen.width;
  //necessary info to run comparison
  @Input() modelNo: any;
  @Input() size: number = 0;
  @Input() variantId: string = '';
  //to get cartProducts
  @Input() cartProducts: any[] = [];
  //custom styles for google maps
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
  // options to style and adjust the google map
  options: google.maps.MapOptions = {
    center: {lat: 51.44157584725519, lng: 7.565725496333208},
    zoom: 8,
    styles: this.styleArray
  };
  //options that are used for marker styling and animation
  markerOptions: google.maps.MarkerOptions = {
    draggable: false,
    animation: google.maps.Animation.DROP
  };

  user: any;
  currentStore: any;
  //storeLocations: {lat: number, lng: number}[];
  storeList : any[] = [];

  currentUserLocation: google.maps.LatLngLiteral = { lat: 31.4914, lng: 74.2385};
  currentLocation: google.maps.LatLngLiteral = { lat: 51.44157584725519, lng: 7.565725496333208};
  logo="../../assets/images/logos/location.png";
  icon = {
    url: "https://fonts.google.com/icons?selected=Material%20Icons%20Outlined%3Awhere_to_vote%3A", // url
  };
  //stores direction result
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
    //getting storeList and user data
    this.storeList = this.cncService.getStoreList();
    this.user = this.cncService.getUser();
    this.currentStore = this.storeList[0];
    //check if size is already selected
    if(this.size>0){
      this.checkProductAvailabilty(this.modelNo, this.size, this.variantId)
    }else{
      //check if cart products are available
      if(this.cartProducts.length>0){
        this.checkAllProductsAvailabilty(this.cartProducts);
      }
    }
  }
  //function to get current user location
  onGetCurrentLocation(){
    this.cncService.getCurrentLocation()
    setTimeout(()=>{
      this.options = {
        center: this.cncService.currentLocation
      };
      this.currentUserLocation = this.cncService.currentLocation;
    },500)
  }
  //function to get directions to selected store
  onGetDirections(location: any){
    this.cncService.getDirections(location);
    this.directionsResults$ = this.cncService.storeDirectionsResults$;
    this.options.zoom=2;
  }
  //triggers when marker is selected and opens infowindow
  openInfoWindow(marker: MapMarker, store: any, event: google.maps.MapMouseEvent) {
    this.currentStore = store;
    this.infoWindow.open(marker);
    this.cncService.currentStoreLocation = event.latLng.toJSON();
  }
  //when store is selected
  onStoreSelect(store: any){
    //if user exists store updated
    if(this.user){
      this.cncService.storeSelected.next(store);
      //if user does not exist then new user created
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
  //checks if the selected product is avaialble in the store or not
  checkProductAvailabilty(modelNo: string, productSize: number,  variantId: string){
    let i=0;
    console.log(this.storeList)
    let newLocations = [];
    let newStore = [];
    for(let store of this.storeList){         //running store loop
      for(let product of store.products){
        if(product.modelNo === modelNo){      //if store product matches modelno of selected product
          console.log("model true");
          for(let variant of product.variants){       //running variants loop
            if(variant.variantId === variantId){        //if variantId matches product variant id
              for(let index=0; index<variant.sizes.length; index++){
                console.log(productSize);
                if(+variant.sizes[index] === +productSize && +variant.inStock[index]>0){  //(+)sign is to convert string to number
                  console.log(variant.sizes[index]);
                  newLocations.push(this.storeLocations[i]);
                  console.log(newLocations);
                  newStore.push(this.storeList[i]);
               }
              }
            }
          }
        }
      }
      i++;
    }
    //adding new locations to storelocations
    this.storeLocations = newLocations;
    this.storeList = newStore;
  }
  //triggers when in checkout page and checks whether all products available or not
  checkAllProductsAvailabilty(cartProducts: any[]){
    let i=0;
    let newLocations: google.maps.LatLngLiteral[] = [];
    let newStores: any[] = [];
    let allProducts = 0;
    //loop for stores in storeList
    for(let store of this.storeList){
      allProducts = 0;
      //looping through products of each store
      for(let product of store.products){
        //looping thorugh cart products
        for(let a=0; a<cartProducts.length; a++){
          if(product.modelNo === cartProducts[a].modelNo){  //if modelNo matched
            console.log('map model match');
            //looping through variants of each product
            for(let variant of product.variants){
              if(variant.variantId === cartProducts[a].variantId){   //if variantId matched
                //looping through each size
                for(let index=0; index<variant.sizes.length; index++){
                  //if size matches and noOfItems in stock does not exceed
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
      //if all products available in that store location and store is pushed
      console.log(allProducts);
      if(allProducts === cartProducts.length){
        newLocations.push(this.storeLocations[i]);
        console.log(newLocations);
        newStores.push(this.storeList[i]);
        console.log(this.storeList[i]);
      }
      i++;
    }
    this.storeLocations = newLocations;
    this.storeList = newStores;
  }

}
