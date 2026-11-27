import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  ComentariosPorPublicacionStat,
  EstadisticasService,
  LikesPorDiaStat,
  LoginPorUsuarioStat,
  PublicacionesPorUsuarioStat,
  VisitasPerfilStatResponse,
} from '../../core/services/estadisticas.service';
import { AuthService } from '../../core/services/auth.service';
import { apiError } from '../../core/services/api-error';

interface SegmentoDona {
  label: string;
  value: number;
  color: string;
  dashArray: string;
  dashOffset: number;
}

@Component({
  selector: 'app-estadisticas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class EstadisticasComponent implements OnInit {
  private estadisticasService = inject(EstadisticasService);
  private authService = inject(AuthService);

  cargando = signal(false);
  error = signal<string | null>(null);

  desde = '';
  hasta = '';

  // Sprint 4
  porUsuario = signal<PublicacionesPorUsuarioStat[]>([]);
  totalComentarios = signal<number>(0);
  porPublicacion = signal<ComentariosPorPublicacionStat[]>([]);

  // Sprint 5
  loginsPorUsuario = signal<LoginPorUsuarioStat[]>([]);
  visitasPerfil = signal<VisitasPerfilStatResponse>({
    totalGeneral: 0,
    porVisitante: [],
  });
  likesPorDia = signal<LikesPorDiaStat[]>([]);

  private readonly paleta = [
    '#2563eb',
    '#10b981',
    '#f59e0b',
    '#8b5cf6',
    '#ef4444',
    '#06b6d4',
    '#ec4899',
  ];

  // --- Helpers Sprint 4 ---
  porcentajeUsuario(total: number): number {
    const max = Math.max(1, ...this.porUsuario().map((u) => u.totalPublicaciones));
    return Math.round((total / max) * 100);
  }

  porcentajePublicacion(total: number): number {
    const max = Math.max(1, ...this.porPublicacion().map((p) => p.totalComentarios));
    return Math.round((total / max) * 100);
  }

  // --- 1. Barras: Logins por usuario ---
  maxLogins = computed(() => {
    const items = this.loginsPorUsuario();
    return Math.max(1, ...items.map((i) => i.totalLogins));
  });

  // --- 2. Dona: Visitas a mi perfil (excluyendo auto-visitas) ---
  readonly radioDona = 58;
  readonly circunferenciaDona = 2 * Math.PI * 58;

  segmentosVisitas = computed<SegmentoDona[]>(() => {
    const visitantes = this.visitasPerfil().porVisitante || [];
    const total = visitantes.reduce((acc, v) => acc + v.totalVisitas, 0);
    if (total === 0) return [];

    let acumulado = 0;
    return visitantes.map((v, idx) => {
      const fraccion = v.totalVisitas / total;
      const longitud = fraccion * this.circunferenciaDona;
      const seg: SegmentoDona = {
        label: `@${v.username}`,
        value: v.totalVisitas,
        color: this.paleta[idx % this.paleta.length],
        dashArray: `${longitud} ${this.circunferenciaDona}`,
        dashOffset: -acumulado,
      };
      acumulado += longitud;
      return seg;
    });
  });

  // --- 3. Líneas: Likes otorgados por día ---
  puntosLineaLikes = computed(() => {
    const datos = this.likesPorDia();
    if (!datos.length) return [];

    const width = 460;
    const height = 180;
    const padX = 36;
    const padY = 24;
    const maxVal = Math.max(1, ...datos.map((d) => d.totalLikes));

    return datos.map((d, idx) => {
      const x =
        datos.length === 1
          ? width / 2
          : padX + (idx / (datos.length - 1)) * (width - padX * 2);
      const y = height - padY - (d.totalLikes / maxVal) * (height - padY * 2);
      return {
        x: Number(x.toFixed(1)),
        y: Number(y.toFixed(1)),
        fecha: d.fecha,
        totalLikes: d.totalLikes,
      };
    });
  });

  polylineLikes = computed(() =>
    this.puntosLineaLikes()
      .map((p) => `${p.x},${p.y}`)
      .join(' '),
  );

  ngOnInit() {
    this.cargarEstadisticas();
  }

  cargarEstadisticas() {
    this.cargando.set(true);
    this.error.set(null);

    const user = this.authService.currentUser() as any;
    const usuarioId = user?.id || user?._id || user?.sub;
    const desde = this.desde || undefined;
    const hasta = this.hasta || undefined;

    forkJoin({
      pubsPorUsuario: this.estadisticasService.obtenerPublicacionesPorUsuario(desde, hasta),
      totalComs: this.estadisticasService.obtenerTotalComentarios(desde, hasta),
      comsPorPub: this.estadisticasService.obtenerComentariosPorPublicacion(desde, hasta),
      logins: this.estadisticasService.obtenerLoginsPorUsuario(desde, hasta),
      visitas: this.estadisticasService.obtenerVisitasPerfil(usuarioId, desde, hasta),
      likes: this.estadisticasService.obtenerLikesPorDia(desde, hasta),
    }).subscribe({
      next: ({ pubsPorUsuario, totalComs, comsPorPub, logins, visitas, likes }) => {
        this.porUsuario.set(pubsPorUsuario || []);
        this.totalComentarios.set(totalComs?.totalComentarios ?? 0);
        this.porPublicacion.set(comsPorPub || []);

        this.loginsPorUsuario.set(logins || []);
        this.visitasPerfil.set(visitas || { totalGeneral: 0, porVisitante: [] });
        this.likesPorDia.set(likes || []);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.cargando.set(false);
      },
    });
  }

  limpiarFiltros() {
    this.desde = '';
    this.hasta = '';
    this.cargarEstadisticas();
  }
}