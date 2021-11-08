import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ClickNCollectService } from '../clickNCollect.service';
import { StoreAvailabilityComponent } from '../storeAvailability/storeAvailability.component';

@Component({
  selector: 'cnc-size-selector',
  templateUrl: './sizeSelector.component.html',
  styleUrls: ['./sizeSelector.component.css']
})
export class SizeSelectorComponent implements OnInit {
  @ViewChild(MatExpansionPanel) expansionPanel!: MatExpansionPanel;
  noOfItems=1;
  size = 0;
  stock = 0;
  @Output() sizeSelected = new EventEmitter<number>();
  isSizeSelected=false;
  preBtn!: Element;
  @Input() product: any;
  @Input() user!: any;
  //@Input() storeLocations: any[] = [];
  //@Input() storeList: any[] = [];

  constructor(
    private cncService: ClickNCollectService,
    public dialog: MatDialog
    ) {}
  ngOnInit(): void {
    this.user= this.cncService.getUser();
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
      if(this.user){
        for(let products of this.user.storeSelected.products){
          if(products.modelNo === this.product.modelNo){
            for(let i=0; i<products.variants[0].sizes.length; i++){
              console.log("sizes are checked")
              if(products.variants[0].sizes[i] === this.size){
                console.log('size matched');
                this.stock = +products.variants[0].inStock[i];
              }
            }
          }
        }
      }
    });

  }
  //runs on size selection
  onSizeSelect(size: number, index:number, product: any){
    this.size = size;
    //if user has already store selected it runs to check availability in that store
    if(this.user){
      for(let products of this.user.storeSelected.products){
        if(products.modelNo === this.product.modelNo){
          for(let i=0; i<products.variants[0].sizes.length; i++){
            console.log("sizes are checked")
            if(products.variants[0].sizes[i] === this.size){
              console.log('size matched');
              this.stock = +products.variants[0].inStock[i];
            }
          }
        }
      }
    }
    this.sizeSelected.emit(size);
    this.isSizeSelected = true;
    //if product not in online store and not in selected store open dialog box to change store
    if(+product.variants[0].inStock[index]===0 && this.stock === 0){
      this.openDialog(product);
    }
    this.expansionPanel.close();
  }
  //open dialog box with storeAvailabilty component
  openDialog(product: any) {
    if(this.isSizeSelected){
      this.dialog.open(StoreAvailabilityComponent, {
        //sending data to dialog box
        data: {
          call: 'size-selector',
          size: this.size,
          modelNo: product.modelNo!,
          sizes: product.variants[0].sizes,
          variantId: product.variants[0].variantId
        },
        //defining size of dialog box
        maxWidth: '100vw',
        maxHeight: '100vh'
      });
    }
  }
  //runs if user clicks on change store
  changeStore(product: any) {
    this.dialog.open(StoreAvailabilityComponent, {
      data: {
        call: 'size-selector',
        size: this.size,
        modelNo: product.modelNo!,
        sizes: product.variants[0].sizes
      },
      maxWidth: '100vw',
      maxHeight: '100vh'
    });
  }
}
