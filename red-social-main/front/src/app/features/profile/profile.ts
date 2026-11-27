import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PostService, Post } from '../../core/services/post.service';
import { UsuariosService, UsuarioAdminItem } from '../../core/services/usuarios.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class PerfilComponent {
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private usuariosService = inject(UsuariosService);
  private router = inject(Router);

  // Recibido automáticamente desde /profile/:id por withComponentInputBinding()
  id = input<string>();

  currentUser = this.authService.currentUser;

  private currentUserId = computed(() => {
    const user: any = this.currentUser();
    return user?.id || user?._id || '';
  });

  esOtroUsuario = computed(() => {
    const routeId = this.id();
    return Boolean(routeId && routeId !== this.currentUserId());
  });

  esAdmin = computed(() => this.currentUser()?.rol === 'admin');

  puedeEliminarPublicaciones = computed(
    () => !this.esOtroUsuario() || this.esAdmin(),
  );

  perfilMostrado = signal<UsuarioAdminItem | null>(null);
  cargandoPerfil = signal(false);
  errorPerfil = signal<string | null>(null);

  misPublicaciones = signal<Post[]>([]);
  cargandoPosts = signal(true);

  mensajeFeedback = signal<{ texto: string; tipo: 'success' | 'error' } | null>(null);

  private ultimaVisitaRegistradaId = signal<string | null>(null);

  constructor() {
    effect(() => {
      const routeId = this.id();
      const myId = this.currentUserId();
      const loggedUser: any = this.currentUser();

      if (routeId && routeId !== myId) {
        this.cargarPerfilAjeno(routeId);
        this.cargarPublicaciones(routeId);

        if (myId && this.ultimaVisitaRegistradaId() !== routeId) {
          this.ultimaVisitaRegistradaId.set(routeId);
          this.usuariosService.registrarVisita(routeId).subscribe({
            error: (err) => console.error('Error al registrar visita al perfil', err),
          });
        }
      } else if (loggedUser && myId) {
        this.perfilMostrado.set(loggedUser);
        this.errorPerfil.set(null);
        this.cargandoPerfil.set(false);
        this.cargarPublicaciones(myId);
      }
    });
  }

  private cargarPerfilAjeno(userId: string) {
    this.cargandoPerfil.set(true);
    this.errorPerfil.set(null);
    this.perfilMostrado.set(null);

    this.usuariosService.obtenerPorId(userId).subscribe({
      next: (usuario) => {
        this.perfilMostrado.set(usuario);
        this.cargandoPerfil.set(false);
      },
      error: (err) => {
        console.error('Error al cargar el perfil del usuario', err);
        this.errorPerfil.set('No se pudo cargar el perfil solicitado.');
        this.cargandoPerfil.set(false);
      },
    });
  }

  cargarPublicaciones(userId?: string) {
    const targetId = userId || this.id() || this.currentUserId();
    if (!targetId) return;

    this.cargandoPosts.set(true);
    this.postService.listarPorUsuario(targetId, 3, 'fecha').subscribe({
      next: (data) => {
        this.misPublicaciones.set(data);
        this.cargandoPosts.set(false);
      },
      error: (err) => {
        console.error('Error al cargar publicaciones del perfil', err);
        this.cargandoPosts.set(false);
      },
    });
  }

  eliminarPublicacion(postId: string) {
    if (!this.puedeEliminarPublicaciones()) {
      this.mostrarFeedback('No tenés permisos para eliminar esta publicación.', 'error');
      return;
    }

    this.postService.eliminarPublicacion(postId).subscribe({
      next: () => {
        this.misPublicaciones.update((posts) =>
          posts.filter((p) => p._id !== postId && (p as any).id !== postId),
        );
        this.mostrarFeedback('Publicación eliminada correctamente.', 'success');
      },
      error: (err) => {
        console.error('Error al eliminar la publicación:', err);
        this.mostrarFeedback('No se pudo eliminar la publicación.', 'error');
      },
    });
  }

  private mostrarFeedback(texto: string, tipo: 'success' | 'error') {
    this.mensajeFeedback.set({ texto, tipo });
    setTimeout(() => {
      this.mensajeFeedback.set(null);
    }, 4000);
  }

  volverAPublicaciones() {
    this.router.navigate(['/home']);
  }
}