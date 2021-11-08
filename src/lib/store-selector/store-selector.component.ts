import { Component, EventEmitter, Input, NgZone, OnInit, Output } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { ClickNCollectService } from '../clickNCollect.service';

@Component({
  selector: 'cnc-store-selector',
  templateUrl: './store-selector.component.html',
  styleUrls: ['./store-selector.component.css']
})
export class StoreSelectorComponent implements OnInit {

  @Input() user!: any;
  //@Input() storeLocations: any[] = [];
  nearByStores: {stores: any, distances: number}[] =[];
  @Input() stores: any[] = [];
  //  @Output() storeChanged= new EventEmitter<any>();
  isStores = false;

  constructor(
    private ngZone: NgZone,
    public dialog: MatDialog,
    private cncService: ClickNCollectService
    ) {}


  ngOnInit(): void {
  //  this.cncService.setStoreLocations(this.storeLocations);
  //  console.log(this.cncService.getStoreLocations());
  //  this.cncService.setStoreList(this.stores);
  //  console.log(this.cncService.stores);
    this.user = this.cncService.getUser();
    this.stores = this.cncService.getStoreList();

    this.cncService.storeSelected.subscribe(store=>{
      if(this.user){
        this.user.storeSelected = store;
      }else{
        this.cncService.setUser({
          name: 'Anonymous',
          storeSelected: store
        });
        this.user = this.cncService.getUser();
      }

    });
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
        this.cncService.find_closest_marker(latitude, longitude);
        if(!this.isStores){
          this.storesNearBy();
        }else {
          this.nearByStores = [];
          this.storesNearBy();
        }

      });
    });

    },1000);

  }

  storesNearBy(){
    let i=0;
      for(let store of this.stores){
        this.nearByStores.push({
          stores: store,
          distances: this.cncService.distanceInKm[i]
        });
        this.nearByStores.sort((a,b)=> a.distances-b.distances)
        i++;
      }
      console.log(this.nearByStores);
      this.isStores = true;
  }

  onStoreSelect(store: any){
    this.cncService.storeSelected.next(store);
    this.nearByStores = [];
  }
}
