import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostService, Post, Comentario } from '../../../../core/services/post.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-detalle-publicacion',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './detalle-publicacion.html',
  styleUrl: './detalle-publicacion.css',
})
export class DetallePublicacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  
  post = signal<Post | null>(null);
  comentarios = signal<Comentario[]>([]);
  totalComentarios = signal(0);
  
  // Paginación de comentarios (trae de 5 en 5)
  limit = 5;
  offset = 0;
  
  nuevoComentarioTexto = '';
  
  // Estado para editar comentarios
  comentarioEditandoId = signal<string | null>(null);
  textoEditado = '';

  ngOnInit() {
    const postId = this.route.snapshot.paramMap.get('id');
    if (postId) {
      this.cargarPublicacion(postId);
      this.cargarComentarios(postId);
    }
  }

  cargarPublicacion(id: string) {
    this.postService.buscar(id).subscribe({
      next: (data: any) => {
        // Aseguramos que se guarde correctamente en la señal del post
        this.post.set(data);
      },
      error: (err) => {
        console.error('Error al cargar la publicación', err);
      }
    });
  }

  cargarComentarios(id: string, reiniciar: boolean = false) {
    if (reiniciar) {
      this.offset = 0;
    }

    this.postService.obtenerComentarios(id, this.limit, this.offset).subscribe({
      next: (res) => {
        this.totalComentarios.set(res.total);
        if (reiniciar) {
          this.comentarios.set(res.comentarios);
        } else {
          // Acumulamos para el botón "Cargar más"
          this.comentarios.update(actuales => [...actuales, ...res.comentarios]);
        }
      },
      error: (err) => console.error('Error al cargar comentarios', err)
    });
  }

  cargarMasComentarios() {
    const currentPost = this.post();
    if (!currentPost) return;

    this.offset += this.limit;
    this.cargarComentarios(currentPost._id, false);
  }

  enviarComentario() {
    const currentPost = this.post();
    if (!currentPost || !this.nuevoComentarioTexto.trim()) return;

    this.postService.comentar(currentPost._id, this.nuevoComentarioTexto).subscribe({
      next: (postActualizado) => {
        this.post.set(postActualizado);
        this.nuevoComentarioTexto = '';
        // Recargamos la primera página de comentarios para ver el nuevo arriba
        this.cargarComentarios(currentPost._id, true);
      },
      error: (err) => alert('No se pudo enviar el comentario')
    });
  }

  // Activar modo edición de un comentario
  iniciarEdicion(comentario: Comentario) {
    this.comentarioEditandoId.set(comentario._id || null);
    this.textoEditado = comentario.texto;
  }

  cancelarEdicion() {
    this.comentarioEditandoId.set(null);
    this.textoEditado = '';
  }

  guardarEdicion(comentarioId: string) {
    const currentPost = this.post();
    if (!currentPost || !this.textoEditado.trim()) return;

    this.postService.modificarComentario(currentPost._id, comentarioId, this.textoEditado).subscribe({
      next: (postActualizado) => {
        this.post.set(postActualizado);
        this.comentarioEditandoId.set(null);
        this.textoEditado = '';
        // Refrescamos la lista de comentarios
        this.cargarComentarios(currentPost._id, true);
      },
      error: (err) => alert('No se pudo editar el comentario')
    });
  }

    // Método para verificar si el usuario logueado es el autor del comentario
  esAutorComentario(comentario: Comentario): boolean {
    const user = this.currentUser();
    if (!user) return false;
    
    const userId = (user as any).id || (user as any)._id;
    const autorId = comentario.autor?._id ? comentario.autor._id.toString() : comentario.autor?.toString();
    
    return autorId === userId;
  }

  volver() {
    this.router.navigate(['/home']);
  }
}