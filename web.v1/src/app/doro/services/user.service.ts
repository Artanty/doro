import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  constructor() { }
  APP_NAME = 'doro'
  getUserToken() {
    return '$e3f12#';
  }

}
