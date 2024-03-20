import { ChangeDetectorRef, Component, Inject, OnInit } from '@angular/core';
import { StoreService } from '../../services/store.service';
import {TTab} from "../../models/app.model";

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent implements OnInit {
  constructor(
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(ChangeDetectorRef) private cdr: ChangeDetectorRef
  ){

  }

  ngOnInit() {
    this.cdr.markForCheck()
  }

  handleClick (data: TTab) {
    this.StoreServ.setViewState(data)

  }

}
