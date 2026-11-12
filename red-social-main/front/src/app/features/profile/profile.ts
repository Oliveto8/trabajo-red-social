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
  
  // Señales para las últimas publicaciones del usuario
  misPublicaciones = signal<Post[]>([]);
  cargandoPosts = signal(true);

  ngOnInit() {
    const user = this.currentUser();
    
    // Solución al error de tipo casteando a any para permitir _id o id
    const userId = user?.id || (user as any)?._id;

    if (userId) {
      // Solicitamos las últimas 3 publicaciones de este usuario en específico
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

  volverAPublicaciones() {
    this.router.navigate(['/home']);
  }
}