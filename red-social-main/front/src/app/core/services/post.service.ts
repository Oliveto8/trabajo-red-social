import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export interface Comentario {
  _id?: string;
  autor: {
    _id?: string;
    nombre: string;
    apellido: string;
    username: string;
    avatar?: string;
  };
  texto: string;
  createdAt: string;
  modificado?: boolean;
}

export interface Post {
  _id: string;
  titulo: string;
  descripcion: string;
  imagen_url?: string;
  autor: {
    _id?: string;
    nombre: string;
    apellido: string;
    username: string;
    avatar?: string;
  };
  likes: string[];
  comentarios: Comentario[];
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class PostService {
  private http = inject(HttpClient);
  private url = environment.apiUrl + '/publicaciones';

  posts = signal<Post[]>([]);

  listar() {
    return this.http.get<Post[]>(this.url);
  }

  buscar(id: string) {
    return this.http.get<Post>(`${this.url}/${id}`);
  }

  crearPost(formData: FormData) {
    return this.http.post<Post>(this.url, formData);
  }

  toggleLike(id: string) {
    return this.http.post<Post>(`${this.url}/${id}/like`, {});
  }

  listarPorUsuario(usuarioId: string, limit: number = 3, orden: string = 'fecha') {
    return this.http.get<Post[]>(
      `${this.url}?usuarioId=${usuarioId}&limit=${limit}&orden=${orden}`,
    );
  }

  comentar(postId: string, texto: string) {
    return this.http.post<Post>(`${this.url}/${postId}/comentarios`, { texto });
  }

  eliminarPublicacion(id: string) {
    return this.http.delete(`${this.url}/${id}`, { responseType: 'text' as 'json' });
  }

  obtenerComentarios(postId: string, limit: number = 5, offset: number = 0) {
    return this.http.get<{ total: number; comentarios: Comentario[] }>(
      `${this.url}/${postId}/comentarios?limit=${limit}&offset=${offset}`,
    );
  }

  modificarComentario(postId: string, comentarioId: string, texto: string) {
    return this.http.put<Post>(
      `${this.url}/${postId}/comentarios/${comentarioId}`,
      { texto },
    );
  }
}