import { Component, signal, inject } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { apiError } from '../../core/services/api-error';
import { AuthService } from '../../core/services/auth.service';
import { PostService, Post } from '../../core/services/post.service';
import { PublicacionComponent } from './components/publicacion/publicacion'; // 👈 1. IMPORTARLO AQUÍ (Ajustá la ruta si está en otra subcarpeta)

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    RouterOutlet, 
    PublicacionComponent // 👈 2. AGREGARLO EN LOS IMPORTS
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home {
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;
  posts = this.postService.posts;
  cargando = signal(false);
  error = signal('');
  selectedFile: File | null = null;

  postForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.maxLength(500)]]
  });

  constructor() {
    this.cargarPosts();
  }

  cargarPosts() {
    this.cargando.set(true);
    this.postService.listar().subscribe({
      next: (data) => {
        this.posts.set(data);
        this.cargando.set(false);
      },
      error: (err) => {
        this.error.set(apiError(err));
        this.cargando.set(false);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
    }
  }

  crearPublicacion() {
    if (this.postForm.invalid) return;

    const values = this.postForm.value;
    const formData = new FormData();
    formData.append('titulo', values.titulo!);
    formData.append('descripcion', values.descripcion!);
    
    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    }

    this.postService.crearPost(formData).subscribe({
      next: (nuevoPost) => {
        this.posts.update((actuales) => [nuevoPost, ...actuales]);
        this.postForm.reset();
        this.selectedFile = null;
        const fileInput = document.getElementById('file-upload') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
      },
      error: (err) => alert(apiError(err))
    });
  }
  
  // Método necesario para actualizar el post cuando el componente hijo emite un like o comentario
  actualizarPostEnLista(postActualizado: Post) {
    this.posts.update((actuales) =>
      actuales.map((p) => (p._id === postActualizado._id ? postActualizado : p))
    );
  }

  logout() {
    this.authService.signOut();
    this.router.navigate(['/login']);
  }
}