import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface UsuarioAdminItem {
  _id?: string;
  id?: string;
  email: string;
  nombre?: string;
  apellido?: string;
  username?: string;
  rol: 'user' | 'admin' | string;
  activo?: boolean;
}

export interface CrearUsuarioAdminPayload {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  username: string;
  rol: 'user' | 'admin';
  fechaNacimiento?: string;
  bio?: string;
  avatar?: string;
}

@Injectable({ providedIn: 'root' })
export class UsuariosService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/usuarios`;

  listar(): Observable<UsuarioAdminItem[]> {
    return this.http.get<UsuarioAdminItem[]>(this.baseUrl);
  }

  crear(datos: CrearUsuarioAdminPayload): Observable<UsuarioAdminItem> {
    return this.http.post<UsuarioAdminItem>(this.baseUrl, datos);
  }

  deshabilitar(id: string): Observable<UsuarioAdminItem> {
    return this.http.delete<UsuarioAdminItem>(`${this.baseUrl}/${id}`);
  }

  habilitar(id: string): Observable<UsuarioAdminItem> {
    return this.http.post<UsuarioAdminItem>(`${this.baseUrl}/${id}/habilitar`, {});
  }
}