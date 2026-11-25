import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  UsuariosService,
  UsuarioAdminItem,
  CrearUsuarioAdminPayload,
} from '../../core/services/usuarios.service';

@Component({
  selector: 'app-panel-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css',
})
export class UsuariosComponent implements OnInit {
  private readonly usuariosService = inject(UsuariosService);

  readonly usuarios = signal<UsuarioAdminItem[]>([]);
  readonly cargando = signal(false);
  readonly enviando = signal(false);
  readonly error = signal<string | null>(null);
  readonly mensajeOk = signal<string | null>(null);

  nuevoUsuario: CrearUsuarioAdminPayload = {
    email: '',
    password: '',
    nombre: '',
    apellido: '',
    username: '',
    rol: 'user',
    bio: '',
    avatar: '',
  };

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.error.set(null);
    this.cargando.set(true);

    this.usuariosService.listar().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(this.extraerMensajeError(err, 'No se pudieron cargar los usuarios.'));
        this.cargando.set(false);
      },
    });
  }

  crearUsuario(): void {
    this.error.set(null);
    this.mensajeOk.set(null);
    this.enviando.set(true);

    const payload: CrearUsuarioAdminPayload = {
      ...this.nuevoUsuario,
      email: this.nuevoUsuario.email.trim(),
      nombre: this.nuevoUsuario.nombre.trim(),
      apellido: this.nuevoUsuario.apellido.trim(),
      username: this.nuevoUsuario.username.trim(),
      bio: this.nuevoUsuario.bio?.trim() || '',
      avatar: this.nuevoUsuario.avatar?.trim() || '',
    };

    this.usuariosService.crear(payload).subscribe({
      next: () => {
        this.enviando.set(false);
        this.mensajeOk.set('Usuario creado correctamente.');
        this.nuevoUsuario = {
          email: '',
          password: '',
          nombre: '',
          apellido: '',
          username: '',
          rol: 'user',
          bio: '',
          avatar: '',
        };
        this.cargarUsuarios();
      },
      error: (err) => {
        this.enviando.set(false);
        this.error.set(this.extraerMensajeError(err, 'No se pudo crear el usuario.'));
      },
    });
  }

  alternarEstado(usuario: UsuarioAdminItem): void {
    const id = usuario._id || usuario.id;
    if (!id) return;

    this.error.set(null);
    this.mensajeOk.set(null);

    const estaActivo = usuario.activo !== false;
    const peticion$ = estaActivo
      ? this.usuariosService.deshabilitar(id)
      : this.usuariosService.habilitar(id);

    peticion$.subscribe({
      next: () => {
        this.mensajeOk.set(
          estaActivo
            ? `Usuario @${usuario.username || usuario.email} dado de baja.`
            : `Usuario @${usuario.username || usuario.email} habilitado.`,
        );
        this.cargarUsuarios();
      },
      error: (err) => {
        this.error.set(
          this.extraerMensajeError(err, 'No se pudo actualizar el estado del usuario.'),
        );
      },
    });
  }

  obtenerId(usuario: UsuarioAdminItem): string {
    return usuario._id || usuario.id || '';
  }

  estaActivo(usuario: UsuarioAdminItem): boolean {
    return usuario.activo !== false;
  }

  private extraerMensajeError(err: any, fallback: string): string {
    const msg = err?.error?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
    if (err?.status === 403) return 'No tenés permisos de administrador.';
    return fallback;
  }
}