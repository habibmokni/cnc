import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ClickNCollectService } from './click-n-collect.service';
import { StoreAvailabilityComponent } from './store-availability/store-availability.component';

@Component({
  selector: 'cnc-click-n-collect',
  templateUrl: './click-n-collect.component.html',
  styleUrls: ['./click-n-collect.component.scss']
})
export class ClickNCollectComponent implements OnInit {

  @ViewChild(MatExpansionPanel) expansionPanel!: MatExpansionPanel;
  @Output() dateSelected= new EventEmitter<Date>();
  @Output() productsToRemove= new EventEmitter<any[]>();
  @Output() orderPrice = new EventEmitter<number>();
  @Output() timeSelected= new EventEmitter<string>();
  @Output() storeChanged = new EventEmitter<any>();
  @Output() isAllItemsAvailable = new EventEmitter<boolean>();

  @Input() cartProducts: any[]=[];
  @Input() stores: any[]=[];
  @Input() user: any= null;
  @Input() storeLocations: any[]=[];
  selectedStore: {address: string, location: {lat: number, lng: number}} = {
    address: 'No store selected',
    location: {
      lat: 0,
      lng: 0
    }
  };

  itemInStock: number[]=[];
  cartItemUnavailable: any[]=[];
  grandTotal: number = 0;
  date!: Date;
  currentTime: number;

  times: number[] = []
  days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  preBtn!: Element;

  allItemsAvailable= true;
  isStoreSelected = false;

  calender: Date[]=[];
  constructor(private dialog: MatDialog, private cncService: ClickNCollectService) {
    const date= new Date();
    const day=date.getDate();
    const month=date.getMonth();
    const year=date.getFullYear();
    this.currentTime= date.getHours();

    for(let i=0; i<7; i++){
      if(i === 0 && this.currentTime > 19){
        console.log("Time for today reservation has ended");
      }else{
        this.calender.push(new Date(year,month,day+i))
      }

    }

   }

  ngOnInit(): void {
    this.stores = this.cncService.getStoreList();
    if(this.cncService.cartProducts){
      this.cartProducts = this.cncService.cartProducts;
    }else {
      this.cncService.setCartProducts(this.cartProducts);
    }
    this.storeLocations = this.cncService.getStoreLocations();
    this.cncService.storeSelected.subscribe(store=>{
      this.storeChanged.emit(store);
      this.user.storeSelected = store;
      this.cartItemUnavailable = [];
      this.checkProductsStock();
      for(let i=0; i<this.itemInStock.length; i++){
        if(this.itemInStock[i] === 0){
          this.allItemsAvailable =false;
          this.cartItemUnavailable.push(this.cartProducts[i]);
          console.log(this.cartItemUnavailable);
        }
      }
    })
    if(this.user){
      this.isStoreSelected = true;
      console.log("without sub");
      this.cartItemUnavailable = [];
      this.checkProductsStock();
      for(let i=0; i<this.itemInStock.length; i++){
        if(this.itemInStock[i] === 0){
          this.isAllItemsAvailable.emit(false);
          this.allItemsAvailable=false;
          this.cartItemUnavailable.push(this.cartProducts[i]);
        }
      }
    }
  }
  onDaySelect(index: number, date: Date){
    this.date = date;
    this.dateSelected.emit(date);
    const buttonList = document.getElementsByClassName('button');
    buttonList[index].classList.add("active");
    if(this.preBtn){
      this.preBtn.classList.remove("active");
    }
    this.preBtn = buttonList[index];
    const currentDate = new Date();
    this.times = [];
    if(date.getDay() === currentDate.getDay()){
      for(let i=this.currentTime+1; i<20; i++){
        this.times.push(i);
      }
    }else {
      for(let i=10; i<20; i++){
        this.times.push(i);
      }
    }

  }
  onTimeSelected(time: number){
    this.timeSelected.emit(time+':00 - '+ (time+1) +":00");
    this.expansionPanel.close();
  }

  onOpenDialog(){
    this.dialog.open(StoreAvailabilityComponent, {
      data: {
        call: 'checkout'
      }
    });
  }

  checkProductsStock(){
    this.itemInStock= [];
    for(let product of this.cartProducts){
      for(let storeProduct of this.user.storeSelected.products){
        if(storeProduct.modelNo === product.modelNo){
          for(let i=0; i<storeProduct.variants[0].sizes.length; i++){
            if(+storeProduct.variants[0].sizes[i]===product.size){
              this.itemInStock.push(+storeProduct.variants[0].inStock[i]);
            }
          }
        }
      }
      this.grandTotal += (product.price*product.noOfItems!);
    }
    this.orderPrice.emit(this.grandTotal);
  }

  removeProductsUnavailable(){
    this.productsToRemove.emit(this.cartItemUnavailable);
    this.isAllItemsAvailable.emit(true);
    this.allItemsAvailable=true
  }

}
