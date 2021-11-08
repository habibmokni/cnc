import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { MapDirectionsService } from "@angular/google-maps";
import { map } from "rxjs/operators";

@Injectable({
  providedIn: 'root'
})
export class ClickNCollectService {
  storeDirectionsResults$!: Observable<google.maps.DirectionsResult|undefined>;
  currentLocation: google.maps.LatLngLiteral = { lat: 51.44157584725519, lng: 7.565725496333208};
  currentStoreLocation!: google.maps.LatLngLiteral;
  distanceInKm: number[] = [];
  stores: any[] = [];
  cartProducts: any[]= [];
  storeSelected= new Subject<any>();
  user: any;
  markerPositions: google.maps.LatLngLiteral[] = [];

  //currentStoreLocation get it from store service
  constructor(private mapDirectionsService: MapDirectionsService){
  }

  getDirections(location: {lat: number, lng: number}){
    const request: google.maps.DirectionsRequest = {
      destination: {lat: location.lat, lng: location.lng},
      origin: {lat: this.currentLocation.lat, lng: this.currentLocation.lng},
      travelMode: google.maps.TravelMode.DRIVING
    };
    this.storeDirectionsResults$ = this.mapDirectionsService.route(request).pipe(map(response => response.result));
  }

  getCurrentLocation(){
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position: GeolocationPosition) => {
          const pos = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          this.currentLocation = pos;
          this.find_closest_marker(pos.lat, pos.lng);
        }
      )};
  }
  rad(x: number) {
    return x*Math.PI/180;
  }
  find_closest_marker(lat: number, lng:number) {
    //var lat = event.latLng.lat();
    //var lng = event.latLng.lng();
    this.distanceInKm = [];
    console.log(lat +'find closest'+ lng);
    var lat = lat;
    var lng = lng;
    var R = 6371; // radius of earth in km
    var distances = [];
    var closest = -1;
    for(let i=0;i<this.markerPositions.length; i++ ) {
        var mlat = this.markerPositions[i].lat;
        var mlng = this.markerPositions[i].lng;
        var dLat  = this.rad(mlat - lat);
        var dLong = this.rad(mlng - lng);
        var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(this.rad(lat)) * Math.cos(this.rad(lat)) * Math.sin(dLong/2) * Math.sin(dLong/2);
        var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        var d = R * c;
        distances[i] = d;
        if ( closest == -1 || d < distances[closest] ) {
            closest = i;
        }

    }
    this.distanceInKm = distances;
  }

  getStoreList(){
    return this.stores;
  }

  setStoreList(stores: any[]){
    this.stores = stores;
  }

  getCartProducts(){
    return this.cartProducts;
  }
  setCartProducts(cartProducts: any[]){
    this.cartProducts = cartProducts;
  }

  getStoreLocations(){
    return this.markerPositions;
  }
  setStoreLocations(locations: any[]){
    this.markerPositions = locations;
  }
  getUser(){
    return this.user;
  }

  setUser(user: any){
    this.user = user;
  }

  storesNearBy(){
    let nearByStores = [];
    let i=0;
      for(let store of this.stores){
        nearByStores.push({
          stores: store,
          distances: this.distanceInKm[i]
        });
        nearByStores.sort((a,b)=> a.distances-b.distances)
        i++;
      }
      return nearByStores;
      console.log(nearByStores);
  }

}
