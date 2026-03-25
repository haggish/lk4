import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', redirectTo: 'new', pathMatch: 'full' },
      {
        path: 'new',
        loadComponent: () =>
          import('./features/landing/landing').then(m => m.LandingComponent),
      },
      {
        path: 'intro',
        loadComponent: () =>
          import('./features/intro/intro').then(m => m.IntroComponent),
      },
      {
        path: 'cv',
        loadComponent: () =>
          import('./features/cv/cv').then(m => m.CvComponent),
      },
      {
        path: 'works',
        loadComponent: () =>
          import('./features/works/works').then(m => m.WorksComponent),
      },
      {
        path: 'archive',
        loadComponent: () =>
          import('./features/archive/archive').then(m => m.ArchiveComponent),
      },
      {
        path: 'other',
        loadComponent: () =>
          import('./features/other/other').then(m => m.OtherComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];