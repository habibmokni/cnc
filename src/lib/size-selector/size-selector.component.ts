import { Component, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { MatExpansionPanel } from '@angular/material/expansion';
import { ClickNCollectService } from '../click-n-collect.service';
import { StoreAvailabilityComponent } from '../store-availability/store-availability.component';

@Component({
  selector: 'cnc-size-selector',
  templateUrl: './size-selector.component.html',
  styleUrls: ['./size-selector.component.css']
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

  onSizeSelect(size: number, index:number, product: any){
    this.size = size;
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
    if(+product.variants[0].inStock[index]===0 && this.stock === 0){
      this.openDialog(product);
    }
    this.expansionPanel.close();
    //const buttonList = document.getElementsByClassName('button');
    //buttonList[index].classList.add("active");
    //if(this.preBtn){
    //  this.preBtn.classList.remove("active");
    //}
    //this.preBtn = buttonList[index];
  }
  openDialog(product: any) {
    if(this.isSizeSelected){
      this.dialog.open(StoreAvailabilityComponent, {
        data: {
          call: 'size-selector',
          size: this.size,
          modelNo: product.modelNo!,
          sizes: product.variants[0].sizes,
          variantId: product.variants[0].variantId
        },
        maxWidth: '100vw',
        maxHeight: '100vh'
      });
    }
  }

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
