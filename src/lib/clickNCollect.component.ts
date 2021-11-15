import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ClickNCollectService } from './clickNCollect.service';
import { ProductAvailabilityComponent } from './productAvailability/productAvailability.component';

@Component({
  selector: 'cnc-click-n-collect',
  templateUrl: './clickNCollect.component.html',
  styleUrls: ['./clickNCollect.component.scss']
})
export class ClickNCollectComponent implements OnInit {

  @ViewChild(MatExpansionPanel) expansionPanel!: MatExpansionPanel;
  //for outputing the results
  @Output() dateSelected= new EventEmitter<Date>();
  @Output() productsToRemove= new EventEmitter<any[]>();
  @Output() orderPrice = new EventEmitter<number>();
  @Output() timeSelected= new EventEmitter<string>();
  @Output() storeChanged = new EventEmitter<any>();
  @Output() isAllItemsAvailable = new EventEmitter<boolean>();
  //for fetching the requried data
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
  //to create our own calender
  times: number[] = []
  days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  preBtn!: Element;
  //checks for item availability
  allItemsAvailable= true;
  isStoreSelected = false;

  calender: Date[]=[];
  constructor(private dialog: MatDialog, private cncService: ClickNCollectService) {
    //creating our inline calender
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
    //fetching storeList
    this.stores = this.cncService.getStoreList();
    //fetching cart products
    if(this.cncService.cartProducts){
      this.cartProducts = this.cncService.cartProducts;
    }else {
      this.cncService.setCartProducts(this.cartProducts);
    }
    //fetching store locations
    this.storeLocations = this.cncService.getStoreLocations();
    //observing store changes
    this.cncService.storeSelected.subscribe(store=>{
      this.storeChanged.emit(store);
      this.user.storeSelected = store;
      this.cartItemUnavailable = [];
      //rechecking products
      this.checkProductsStock();
      for(let i=0; i<this.itemInStock.length; i++){
        if(this.itemInStock[i] === 0){
          this.allItemsAvailable =false;
          this.cartItemUnavailable.push(this.cartProducts[i]);
          console.log(this.cartItemUnavailable);
        }
      }
    })
    //if user exists
    if(this.user){
      this.isStoreSelected = true;
      this.cartItemUnavailable = [];
      //checking products stock
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
  //when user selects day
  onDaySelect(index: number, date: Date){
    this.date = date;
    this.dateSelected.emit(date);
    //styling the button selected
    const buttonList = document.getElementsByClassName('dateButton');
    buttonList[index].classList.add("active");
    if(this.preBtn){
      this.preBtn.classList.remove("active");
    }
    this.preBtn = buttonList[index];
    const currentDate = new Date();
    this.times = [];
    //check if todays time exceeds time limit
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
  //runs if time selected
  onTimeSelected(time: number){
    this.timeSelected.emit(time+':00 - '+ (time+1) +":00");
    this.expansionPanel.close();
  }
  //calling storeAvailabilty Component
  onOpenDialog(){
    this.dialog.open(ProductAvailabilityComponent, {
      data: {
        call: 'checkout'
      }
    });
  }
  //checking product stock
  checkProductsStock(){
    this.itemInStock= [];
    for(let product of this.cartProducts){
      for(let storeProduct of this.user.storeSelected.products){
        if(storeProduct.modelNo === product.modelNo){
          for(let variant of storeProduct.variants){
            if(variant.variantId === product.variantId){
              for(let i=0; i<variant.sizes.length; i++){
                if(+variant.sizes[i]===product.size){
                  this.itemInStock.push(+variant.inStock[i]);
                }
              }
            }
          }
        }
      }
      this.grandTotal += (product.price*product.noOfItems!);
    }
    this.orderPrice.emit(this.grandTotal);
  }
  //remove items not available
  removeProductsUnavailable(){
    this.allItemsAvailable=true;
    this.productsToRemove.emit(this.cartItemUnavailable);
    this.isAllItemsAvailable.emit(true);
  }

}
