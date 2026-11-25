import { Component, computed, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  EstadisticasService,
  PublicacionPorUsuarioStat,
  ComentariosPorPublicacionStat,
} from '../../core/services/estadisticas.service';

@Component({
  selector: 'app-dashboard-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class EstadisticasComponent implements OnInit {
  private readonly estadisticasService = inject(EstadisticasService);

  desde = '';
  hasta = '';

  readonly cargando = signal(false);
  readonly error = signal<string | null>(null);
  readonly porUsuario = signal<PublicacionPorUsuarioStat[]>([]);
  readonly totalComentarios = signal<number>(0);
  readonly porPublicacion = signal<ComentariosPorPublicacionStat[]>([]);

  private readonly maxPublicacionesUsuario = computed(() =>
    Math.max(0, ...this.porUsuario().map((x) => x.totalPublicaciones)),
  );

  private readonly maxComentariosPublicacion = computed(() =>
    Math.max(0, ...this.porPublicacion().map((x) => x.totalComentarios)),
  );

  ngOnInit(): void {
    this.cargarEstadisticas();
  }

  cargarEstadisticas(): void {
    this.error.set(null);

    if (this.desde && this.hasta && this.desde > this.hasta) {
      this.error.set('La fecha "Desde" no puede ser mayor que "Hasta".');
      return;
    }

    this.cargando.set(true);

    forkJoin({
      usuarios: this.estadisticasService.obtenerPublicacionesPorUsuario(
        this.desde || undefined,
        this.hasta || undefined,
      ),
      comentarios: this.estadisticasService.obtenerTotalComentarios(
        this.desde || undefined,
        this.hasta || undefined,
      ),
      publicaciones: this.estadisticasService.obtenerComentariosPorPublicacion(
        this.desde || undefined,
        this.hasta || undefined,
      ),
    }).subscribe({
      next: ({ usuarios, comentarios, publicaciones }) => {
        this.porUsuario.set(usuarios);
        this.totalComentarios.set(comentarios.totalComentarios);
        this.porPublicacion.set(publicaciones);
        this.cargando.set(false);
      },
      error: (err) => {
        const msg =
          err?.error?.message ||
          (err?.status === 403
            ? 'No tenés permisos de administrador para ver estas estadísticas.'
            : 'No se pudieron cargar las estadísticas.');
        this.error.set(Array.isArray(msg) ? msg.join(', ') : msg);
        this.cargando.set(false);
      },
    });
  }

  limpiarFiltros(): void {
    this.desde = '';
    this.hasta = '';
    this.cargarEstadisticas();
  }

  porcentajeUsuario(cantidad: number): number {
    const max = this.maxPublicacionesUsuario();
    return max > 0 ? Math.round((cantidad / max) * 100) : 0;
  }

  porcentajePublicacion(cantidad: number): number {
    const max = this.maxComentariosPublicacion();
    return max > 0 ? Math.round((cantidad / max) * 100) : 0;
  }
}