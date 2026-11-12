import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { catchError, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Usuario } from '../models/usuario.interface';

interface Sesion {
  access_token: string;
}

// Perfil extiende de Usuario y hereda todos sus campos obligatorios/opcionales correctamente.
// Si necesitás agregar algo exclusivo de Perfil que no esté en Usuario, lo ponés acá.
interface Perfil extends Usuario {
  // Ya no redeclaramos email ni username para evitar conflictos de tipos.
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private url = environment.apiUrl + '/auth';
  private key = 'biblioteca-token';
  currentUser = signal<Perfil | null>(null);
  currentUserData = signal<Usuario | null>(null);

  accessToken() {
    return localStorage.getItem(this.key);
  }

  signIn(email: string, password: string) {
    return this.http.post<Sesion>(this.url + '/login', { email, password });
  }

  signUp(datos: any) {
    return this.http.post<Sesion>(this.url + '/register', datos);
  }

  iniciarSesion(token: string) {
    localStorage.setItem(this.key, token);
    return this.cargarPerfil();
  }

  private cargarPerfil() {
    return this.http.get<Perfil>(this.url + '/me').pipe(
      tap((perfil) => {
        this.currentUser.set(perfil);
        this.currentUserData.set(perfil);
      }),
    );
  }

  restaurarSesion() {
    if (!this.accessToken()) return of(null);
    return this.cargarPerfil().pipe(
      catchError(() => {
        this.signOut();
        return of(null);
      }),
    );
  }

  signOut() {
    localStorage.removeItem(this.key);
    this.currentUser.set(null);
    this.currentUserData.set(null);
  }
}