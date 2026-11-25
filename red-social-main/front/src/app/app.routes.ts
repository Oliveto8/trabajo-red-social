import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { authAdminGuard } from './core/guards/auth-admin-guard';

export const routes: Routes = [
  // Ruta inicial: Pantalla de carga que valida el token
  {
    path: '',
    loadComponent: () => import('./features/auth/carga/carga').then(c => c.CargaComponent)
  },

  // Ruta principal de Publicaciones (Home)
  {
    path: 'home',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/home').then(c => c.Home),
  },
  
  // Ruta para la pantalla "Mi Perfil" (Sprint 1)
  { 
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/profile').then(c => c.PerfilComponent),
  },

  // NUEVA RUTA (Sprint 3): Detalle de Publicación con Comentarios
  {
    path: 'publicacion/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/home/components/detalle-publicacion/detalle-publicacion').then(c => c.DetallePublicacionComponent),
  },

  // NUEVA RUTA (Sprint 4): Estadísticas para Administrador
  {
    path: 'estadisticas',
    canActivate: [authGuard, authAdminGuard],
    loadComponent: () =>
      import('./features/estadisticas/estadisticas').then(c => c.EstadisticasComponent),
  },

  {
  path: 'usuarios',
  canActivate: [authGuard, authAdminGuard],
  loadComponent: () =>
    import('./features/usuarios/usuarios').then(c => c.UsuariosComponent),
},

  // Rutas de Autenticación (Login y Registro)
  { path: 'login',
     loadComponent: () => import('./features/auth/login/login').then(c => c.LoginComponent),
   },
  { path: 'register', 
     loadComponent: () => import('./features/auth/register/register').then(c => c.RegisterComponent),
   },

  // Wildcard: cualquier ruta no definida redirige a la raíz
  { path: '**', redirectTo: '' }
];