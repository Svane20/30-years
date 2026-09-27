import { Routes } from '@angular/router';
import { App } from './components/app/app';

export const routes: Routes = [
  {
    path: '',
    component: App,
  },
  {
    path: '**',
    redirectTo: '',
    pathMatch: 'full',
  },
];
