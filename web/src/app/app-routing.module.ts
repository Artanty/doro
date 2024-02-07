import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { DoroComponent } from './doro/doro.component';

const routes: Routes = [
  { path: '', redirectTo: '/doro', pathMatch: 'full' },
  { path: 'doro', component: DoroComponent }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
