import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { PostService, Post } from '../../core/services/post.service';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class PerfilComponent implements OnInit {
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private router = inject(Router);

  currentUser = this.authService.currentUser;
  
  misPublicaciones = signal<Post[]>([]);
  cargandoPosts = signal(true);
  
  // NUEVO: Señal para mostrar avisos en pantalla sin alerts
  mensajeFeedback = signal<{ texto: string; tipo: 'success' | 'error' } | null>(null);

  ngOnInit() {
    this.cargarPublicaciones();
  }

  cargarPublicaciones() {
    const user = this.currentUser();
    const userId = user?.id || (user as any)?._id;

    if (userId) {
      this.cargandoPosts.set(true);
      this.postService.listarPorUsuario(userId, 3).subscribe({
        next: (data) => {
          this.misPublicaciones.set(data);
          this.cargandoPosts.set(false);
        },
        error: (err) => {
          console.error('Error al cargar publicaciones del perfil', err);
          this.cargandoPosts.set(false);
        }
      });
    }
  }

  eliminarPublicacion(postId: string) {
    this.postService.eliminarPublicacion(postId).subscribe({
      next: () => {
        // Filtramos la señal para que desaparezca al instante
        this.misPublicaciones.update(posts => 
          posts.filter(p => p._id !== postId && (p as any).id !== postId)
        );
        
        // Mostramos aviso visual de éxito
        this.mostrarFeedback('Publicación eliminada correctamente.', 'success');
      },
      error: (err) => {
        console.error('Error al eliminar la publicación:', err);
        // Mostramos aviso visual de error
        this.mostrarFeedback('No se pudo eliminar la publicación.', 'error');
      }
    });
  }

  // Helper para mostrar y ocultar solo los avisos visuales
  private mostrarFeedback(texto: string, tipo: 'success' | 'error') {
    this.mensajeFeedback.set({ texto, tipo });
    setTimeout(() => {
      this.mensajeFeedback.set(null); // Se oculta solo a los 4 segundos
    }, 4000);
  }

  volverAPublicaciones() {
    this.router.navigate(['/home']);
  }
}