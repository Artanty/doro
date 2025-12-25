import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DoroComponent } from './doro/doro.component';
import { loadRemoteModule } from '@angular-architects/module-federation'


const AU_APP_URL = "http://localhost:4204/remoteEntry.js"
const AU_APP_URL_PROD = "https://au2.vercel.app/remoteEntry.js"

// const routes: Routes = [
//   { path: '', redirectTo: '/doro', pathMatch: 'full' },
//   { path: 'doro', component: DoroComponent },
//   // {
//   //   path: 'au',
//   //   loadChildren: () => {
//   //     return loadRemoteModule({
//   //       remoteEntry: AU_APP_URL_PROD,
//   //       remoteName: 'au',
//   //       exposedModule: './Module'
//   //     }).then(m => m.AuthModule).catch(err => console.log(err));
//   //   }
//   // },
//   {
//     path: 'au',
//     loadChildren: () => {
//       return loadRemoteModule({
//         remoteEntry: AU_APP_URL,
//         remoteName: 'au',
//         exposedModule: './Module'
//       }).then(m => m.AuthModule).catch(err => console.log(err));
//     }
//   },
//   {
//     path: 'au-component',
//     loadComponent: () => {
//       return loadRemoteModule({
//         remoteName: 'au',
//         // remoteEntry: AU_APP_URL,
//         remoteEntry: AU_APP_URL_PROD,
//         exposedModule: './Component'
//       }).then(m => m.AuthComponent).catch(err => console.log(err));
//     }
//   },
// ];

const routes: Routes = [
  { 
    path: 'doro',
    loadChildren: () => import('./doro/doro.module').then(m => m.DoroModule)
  },
]

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule {}


// @NgModule({
//   imports: [RouterModule.forRoot(routes, {
//     preloadingStrategy: DirectivePreloadingStrategy  // Custom strategy
//   })],
//   exports: [RouterModule]
// })
// export class AppRoutingModule {}
