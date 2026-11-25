import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PublicacionPorUsuarioStat {
  usuarioId: string;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  totalPublicaciones: number;
}

export interface TotalComentariosStat {
  totalComentarios: number;
}

export interface ComentariosPorPublicacionStat {
  publicacionId: string;
  titulo: string;
  autorUsername: string;
  createdAt: string;
  totalComentarios: number;
}

@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/publicaciones/estadisticas`;

  obtenerPublicacionesPorUsuario(
    desde?: string,
    hasta?: string,
  ): Observable<PublicacionPorUsuarioStat[]> {
    return this.http.get<PublicacionPorUsuarioStat[]>(
      `${this.baseUrl}/publicaciones-por-usuario`,
      { params: this.crearParams(desde, hasta) },
    );
  }

  obtenerTotalComentarios(
    desde?: string,
    hasta?: string,
  ): Observable<TotalComentariosStat> {
    return this.http.get<TotalComentariosStat>(
      `${this.baseUrl}/comentarios`,
      { params: this.crearParams(desde, hasta) },
    );
  }

  obtenerComentariosPorPublicacion(
    desde?: string,
    hasta?: string,
  ): Observable<ComentariosPorPublicacionStat[]> {
    return this.http.get<ComentariosPorPublicacionStat[]>(
      `${this.baseUrl}/comentarios-por-publicacion`,
      { params: this.crearParams(desde, hasta) },
    );
  }

  private crearParams(desde?: string, hasta?: string): HttpParams {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    return params;
  }
}