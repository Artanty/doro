import { Component, Inject } from '@angular/core';
import { StoreService } from '../../services/store.service';

@Component({
  selector: 'app-navigation',
  templateUrl: './navigation.component.html',
  styleUrl: './navigation.component.scss'
})
export class NavigationComponent {
  constructor(
    @Inject(StoreService) private StoreServ: StoreService
  ){}

  handleClick (data: any) {
    this.StoreServ.setViewState(data)
  }

}
