import { Routes } from '@angular/router';
import { sessionGuard } from './core/session.guard';
import { Portfolio } from './pages/portfolio/portfolio';
import { UserSelect } from './pages/user-select/user-select';

export const routes: Routes = [
  { path: '', component: UserSelect },
  { path: 'portafolio', component: Portfolio, canActivate: [sessionGuard] },
  { path: '**', redirectTo: '' },
];
