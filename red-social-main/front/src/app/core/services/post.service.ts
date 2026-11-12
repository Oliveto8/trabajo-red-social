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

  crearPost(formData: FormData) {
    return this.http.post<Post>(this.url, formData);
  }

  toggleLike(id: string) {
    return this.http.post<Post>(`${this.url}/${id}/like`, {});
  }

  listarPorUsuario(usuarioId: string, limit: number = 3) {
    return this.http.get<Post[]>(`${this.url}?usuarioId=${usuarioId}&limit=${limit}`);
  }

  // Método para enviar un comentario a una publicación
  comentar(postId: string, texto: string) {
    return this.http.post<Post>(`${this.url}/${postId}/comentarios`, { texto });
  }
}