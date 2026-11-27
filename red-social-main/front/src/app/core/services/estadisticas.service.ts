import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PublicacionesPorUsuarioStat {
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
  createdAt?: string;
  totalComentarios: number;
}

export interface LoginPorUsuarioStat {
  usuarioId: string;
  nombre: string;
  apellido: string;
  username: string;
  email: string;
  totalLogins: number;
  ultimoIngreso?: string;
}

export interface VisitaPorVisitanteStat {
  visitanteId: string;
  nombre: string;
  apellido: string;
  username: string;
  totalVisitas: number;
  ultimaVisita?: string;
}

export interface VisitasPerfilStatResponse {
  totalGeneral: number;
  porVisitante: VisitaPorVisitanteStat[];
}

export interface LikesPorDiaStat {
  fecha: string;
  totalLikes: number;
}

@Injectable({
  providedIn: 'root',
})
export class EstadisticasService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl.replace(/\/+$/, '')}/publicaciones/estadisticas`;

  private buildParams(desde?: string, hasta?: string, extra?: Record<string, string>): HttpParams {
    let params = new HttpParams();
    if (desde) params = params.set('desde', desde);
    if (hasta) params = params.set('hasta', hasta);
    if (extra) {
      for (const [key, val] of Object.entries(extra)) {
        if (val) params = params.set(key, val);
      }
    }
    return params;
  }

  // --- Sprint 4 ---
  obtenerPublicacionesPorUsuario(desde?: string, hasta?: string): Observable<PublicacionesPorUsuarioStat[]> {
    return this.http.get<PublicacionesPorUsuarioStat[]>(`${this.baseUrl}/publicaciones-por-usuario`, {
      params: this.buildParams(desde, hasta),
    });
  }

  obtenerTotalComentarios(desde?: string, hasta?: string): Observable<TotalComentariosStat> {
    return this.http.get<TotalComentariosStat>(`${this.baseUrl}/comentarios`, {
      params: this.buildParams(desde, hasta),
    });
  }

  obtenerComentariosPorPublicacion(desde?: string, hasta?: string): Observable<ComentariosPorPublicacionStat[]> {
    return this.http.get<ComentariosPorPublicacionStat[]>(`${this.baseUrl}/comentarios-por-publicacion`, {
      params: this.buildParams(desde, hasta),
    });
  }

  // --- Sprint 5 ---
  obtenerLoginsPorUsuario(desde?: string, hasta?: string): Observable<LoginPorUsuarioStat[]> {
    return this.http.get<LoginPorUsuarioStat[]>(`${this.baseUrl}/logins-por-usuario`, {
      params: this.buildParams(desde, hasta),
    });
  }

  obtenerVisitasPerfil(
    usuarioId?: string,
    desde?: string,
    hasta?: string,
  ): Observable<VisitasPerfilStatResponse> {
    return this.http.get<VisitasPerfilStatResponse>(`${this.baseUrl}/visitas-perfil`, {
      params: this.buildParams(desde, hasta, usuarioId ? { usuarioId } : undefined),
    });
  }

  obtenerLikesPorDia(desde?: string, hasta?: string): Observable<LikesPorDiaStat[]> {
    return this.http.get<LikesPorDiaStat[]>(`${this.baseUrl}/likes-por-dia`, {
      params: this.buildParams(desde, hasta),
    });
  }
}