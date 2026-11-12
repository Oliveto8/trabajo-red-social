import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  // Redirección: la ruta vacía redirige a /home (Publicaciones)
  { path: '', redirectTo: '/home', pathMatch: 'full' },

  // Ruta principal de Publicaciones (Home)
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then(c => c.Home), // Asegurate de que la clase se llame HomeComponent o Home
  },
  
  // Ruta para la pantalla "Mi Perfil" (Sprint 1)
  { 
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then(c => c.PerfilComponent),
   },

  // Rutas de Autenticación (Login y Registro)
  { path: 'login',
     loadComponent: () => import('./features/auth/login/login').then(c => c.LoginComponent),
   },
  { path: 'register', 
     loadComponent: () => import('./features/auth/register/register').then(c => c.RegisterComponent),
   },


  // Wildcard: cualquier ruta no definida redirige a /home
  { path: '**', redirectTo: '/home' }
];