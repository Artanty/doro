import { Inject, Injectable } from '@angular/core';
import { getEntryFromSseResponse } from "../helpers/getEntryFromSseResponse";
import { HttpClient } from "@angular/common/http";

@Injectable({
  providedIn: 'root'
})
export class ClientService {

  constructor(
    @Inject(HttpClient) private http: HttpClient, 
  ) {}

  setClientId(res: any) {
    return new Promise((resolve, reject) => {
      const storedClientId = localStorage.getItem('clientId')
      console.log(storedClientId)
      if (!storedClientId) {
        const clientId = getEntryFromSseResponse(res, 'clientId')
        localStorage.setItem('clientId', clientId)
      }
      resolve(true)
    })
  }

  getClientId(): number | void {
    try {
      const ls = localStorage.getItem('clientId')
      if (ls) {
        return Number(ls)
      }
      throw new Error('no client id')
    } catch (e) {
      console.log(e)
    }
  }

  checkClientId(clientId: number) {
    const data = { clientId: clientId }//JSON.stringify({data: 'wwww'})
    return this.http.post(`${process.env['SERVER_URL']}/checkClientId`, data)
  }

  getClients() {
    this.http.get(`${process.env['SERVER_URL']}/status`).subscribe(res => console.log(res))
  }
}
