import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { apiError } from '../../../core/services/api-error';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private authService = inject(AuthService);

  registerForm = this.fb.group({
    nombre: ['', [Validators.required, Validators.minLength(2)]],
    apellido: ['', [Validators.required, Validators.minLength(2)]],
    username: ['', [Validators.required, Validators.minLength(3)]], // <-- Agregado
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    fechaNacimiento: [''], // <-- Agregado
    bio: [''],             // <-- Agregado
    avatar: ['']           // <-- Agregado
  });

  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  onSubmit() {
      if (this.registerForm.invalid) return;

      this.isLoading.set(true);
      this.errorMessage.set(null);
      this.successMessage.set(null);

      // Enviamos directamente el valor del formulario completo al servicio
      this.authService.signUp(this.registerForm.value).subscribe({
        next: (sesion) => {
          this.authService.iniciarSesion(sesion.access_token).subscribe({
            next: () => {
              this.isLoading.set(false);
              this.router.navigate(['/home']);
            },
            error: (error) => {
              this.authService.signOut();
              this.errorMessage.set(apiError(error));
              this.isLoading.set(false);
            },
          });
        },
        error: (error) => {
          this.errorMessage.set(apiError(error));
          this.isLoading.set(false);
        },
      });
    }
}