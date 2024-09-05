import { loadRemoteModule } from "@angular-architects/module-federation"
import { Component, ViewChild, ViewContainerRef } from "@angular/core"
// export const authProps: IAuthDto = {
//   productName: "doro",
//   authStrategy: "backend",
//   payload: {
//     checkBackendUrl: "https://cs99850.tmweb.ru/login",
//     signInByDataUrl: "https://cs99850.tmweb.ru/login",
//     signInByTokenUrl: "https://cs99850.tmweb.ru/loginByToken",
//   },
//   from: "product",
//   status: "init",
// }
@Component({
  selector: "app-root",
  template: `
    <h1>Welcome to {{ title }}!</h1>
    <div class="mfeWrapper" #placeHolder></div>
    <router-outlet></router-outlet>
  `,
  styles: [],
})
export class AppComponent {
  @ViewChild("placeHolder", { read: ViewContainerRef })
  viewContainer!: ViewContainerRef
  // authEventBus$!: BehaviorSubject<IAuthDto>
  title = "web-host"

  constructor() {
    // this.authEventBus$ = new BehaviorSubject(authProps)
    this.loadComponent()
  }

  async loadComponent(): Promise<void> {
    const m = await loadRemoteModule({
      remoteName: "doro",
      remoteEntry: "./assets/mfe/doro/remoteEntry.js",
      // remoteEntry: "http://localhost:4201/remoteEntry.js",
      exposedModule: "./Component",
    })
    this.viewContainer.createComponent(m.DoroComponent)
    // this.viewContainer.createComponent(m.DoroComponent, {
    //   injector: Injector.create({
    //     providers: [],
    //     parent: this.injector
    //   })
    // })

    // const m = await loadRemoteModule({
    //   remoteName: "au",
    //   remoteEntry: "./assets/mfe/au/remoteEntry.js",
    //   exposedModule: "./Component",
    // })

    // this.viewContainer.createComponent(m.AuthComponent, {
    //   injector: Injector.create({
    //     providers: [
    //       { provide: EVENT_BUS, useValue: this.authEventBus$ },
    //       { provide: PRODUCT_NAME, useValue: "doro" },
    //     ],
    //   }),
    // })
  }
}
