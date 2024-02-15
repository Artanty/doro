import { Component, Inject } from '@angular/core';
import { StoreService } from '../../services/store.service';
import {TTab} from "../../models/app.model";

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  constructor(
    @Inject(StoreService) private StoreServ: StoreService
  ){}

  handleClick (data: TTab) {
    this.StoreServ.setViewState(data)
  }

}
