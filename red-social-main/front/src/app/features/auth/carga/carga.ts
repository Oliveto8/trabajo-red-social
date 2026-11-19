import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-carga',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './carga.html',
  styleUrl: './carga.css'
})
export class CargaComponent implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    // Intentamos restaurar la sesión usando el token guardado y el endpoint /me
    this.authService.restaurarSesion().subscribe({
      next: (usuario) => {
        if (usuario) {
          // Token válido y perfil cargado con éxito -> Al Home
          this.router.navigate(['/home']);
        } else {
          // No hay token o falló la validación -> Al Login
          this.router.navigate(['/login']);
        }
      },
      error: () => {
        // Si hay error en la red o 401 -> Al Login
        this.router.navigate(['/login']);
      }
    });
  }
}