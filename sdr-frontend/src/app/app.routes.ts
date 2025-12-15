import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/browse/browse.component').then(m => m.BrowseComponent)
  },
  {
    path: 'recipe/:id',
    loadComponent: () => import('./components/recipe-expanded/recipe-expanded.component').then(m => m.RecipeExpandedComponent)
  },
  {
    path: '**',
    redirectTo: ''
  }
];
