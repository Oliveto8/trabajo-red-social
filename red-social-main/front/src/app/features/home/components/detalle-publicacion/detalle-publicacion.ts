import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PostService, Post, Comentario } from '../../../../core/services/post.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-detalle-publicacion',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './detalle-publicacion.html',
  styleUrl: './detalle-publicacion.css',
})
export class DetallePublicacionComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private postService = inject(PostService);
  private authService = inject(AuthService);

  currentUser = this.authService.currentUser;
  currentUserData = this.authService.currentUserData;

  post = signal<Post | null>(null);
  comentarios = signal<Comentario[]>([]);
  totalComentarios = signal(0);
  confirmandoEliminar = signal(false);
  eliminando = signal(false);

  errorEliminar = signal<string | null>(null);
  errorComentario = signal<string | null>(null);

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

  obtenerAutorId(autor: any): string | null {
    if (!autor) return null;
    if (typeof autor === 'string') return autor;
    return autor._id || autor.id || null;
  }

  esAdmin(): boolean {
    return this.currentUserData()?.rol === 'admin';
  }

  pedirConfirmacionEliminar() {
    if (!this.post() || !this.esAdmin() || this.eliminando()) return;
    this.errorEliminar.set(null);
    this.confirmandoEliminar.set(true);
  }

  cancelarEliminar() {
    this.confirmandoEliminar.set(false);
  }

  confirmarEliminarPublicacion() {
    const currentPost = this.post();
    if (!currentPost || !this.esAdmin() || this.eliminando()) return;

    this.errorEliminar.set(null);
    this.confirmandoEliminar.set(false);
    this.eliminando.set(true);

    this.postService.eliminarPublicacion(currentPost._id).subscribe({
      next: () => {
        this.eliminando.set(false);
        this.postService.posts.update((lista) =>
          lista.filter((item) => item._id !== currentPost._id)
        );
        this.router.navigate(['/home']);
      },
      error: (err) => {
        console.error('Error al eliminar la publicación', err);
        this.eliminando.set(false);
        this.errorEliminar.set('No se pudo eliminar la publicación');
      },
    });
  }

  cargarPublicacion(id: string) {
    this.postService.buscar(id).subscribe({
      next: (data: any) => {
        this.post.set(data);
      },
      error: (err) => {
        console.error('Error al cargar la publicación', err);
      },
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
          this.comentarios.update((actuales) => [...actuales, ...res.comentarios]);
        }
      },
      error: (err) => console.error('Error al cargar comentarios', err),
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

    this.errorComentario.set(null);
    this.postService.comentar(currentPost._id, this.nuevoComentarioTexto).subscribe({
      next: (postActualizado) => {
        this.post.set(postActualizado);
        this.nuevoComentarioTexto = '';
        this.cargarComentarios(currentPost._id, true);
      },
      error: (err) => {
        console.error('Error al enviar el comentario', err);
        this.errorComentario.set('No se pudo enviar el comentario');
      },
    });
  }

  iniciarEdicion(comentario: Comentario) {
    this.errorComentario.set(null);
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

    this.errorComentario.set(null);
    this.postService.modificarComentario(currentPost._id, comentarioId, this.textoEditado).subscribe({
      next: (postActualizado) => {
        this.post.set(postActualizado);
        this.comentarioEditandoId.set(null);
        this.textoEditado = '';
        this.cargarComentarios(currentPost._id, true);
      },
      error: (err) => {
        console.error('Error al editar el comentario', err);
        this.errorComentario.set('No se pudo editar el comentario');
      },
    });
  }

  esAutorComentario(comentario: Comentario): boolean {
    const user = this.currentUser();
    if (!user) return false;

    const userId = (user as any).id || (user as any)._id;
    const autorId = this.obtenerAutorId(comentario.autor);

    return autorId === userId;
  }

  volver() {
    this.router.navigate(['/home']);
  }
}