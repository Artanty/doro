import { ApiService } from './../api/api.service'
import {StoreService} from "./store.service";
import { tap } from 'rxjs';
import {
  Inject,
  Injectable
} from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {

  constructor(
    @Inject(StoreService) private StoreServ: StoreService,
    @Inject(ApiService) private ApiServ: ApiService
  ) { }

  getSchedule (id: number) {
    this.ApiServ.requestSchedule(id).pipe(
      tap((res: any) => {
        this.StoreServ.setSchedule(res)
      })
    ).subscribe()
  }
}
