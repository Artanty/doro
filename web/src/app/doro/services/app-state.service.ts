import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { obs$ } from '../utilites/observable-variable';
import { BusEvent } from 'typlib';
import { Nullable } from '../utilites/utility.types';


@Injectable({
  providedIn: 'root'
})
export class AppStateService {
  public configHash = obs$<number>(0);
  
  // public userAction = obs$<Nullable<UserAction>>(null)
  // public isLoggedIn = obs$<boolean>(false)
  // public userProfile = obs$<Nullable<UserData>>(null)
  // public view = obs$<Nullable<ViewState>>(null) //todo reset on view change
  // public authConfig = obs$<Nullable<IAuthDto>>(null)
  // public lastRoute = obs$<string>('/') // todo get host home route
}