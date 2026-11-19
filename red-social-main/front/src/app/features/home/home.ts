import { Component, signal, inject, computed, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { apiError } from '../../core/services/api-error';
import { AuthService } from '../../core/services/auth.service';
import { PostService, Post } from '../../core/services/post.service';
import { PublicacionComponent } from './components/publicacion/publicacion';
import { SessionModalComponent } from './components/session-modal';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    RouterOutlet, 
    PublicacionComponent,
    SessionModalComponent
  ],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private postService = inject(PostService);
  private router = inject(Router);
  private fb = inject(FormBuilder);

  currentUser = this.authService.currentUser;
  posts = this.postService.posts;
  cargando = signal(false);
  error = signal('');
  selectedFile: File | null = null;

  // Estado para el criterio de ordenamiento
  criterioOrden = signal<'antiguas' | 'recientes' | 'menos-likes' | 'mas-likes'>('recientes');

  // SPRINT 3: Convertimos la variable en una Signal para asegurar la reactividad visual
  mostrarModalSesion = signal(false);
  private timerSesion: any;
  private tiempoAvisoMs = 1 * 60 * 1000; // 1 minuto (puedes cambiarlo a 10000 para probar en 10 seg)

  // Señal computada para ordenar los posts de manera reactiva
  postsOrdenados = computed(() => {
    const lista = [...this.posts()];
    const criterio = this.criterioOrden();

    return lista.sort((a, b) => {
      if (criterio === 'antiguas') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      } else if (criterio === 'recientes') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (criterio === 'menos-likes') {
        return (a.likes?.length || 0) - (b.likes?.length || 0);
      } else if (criterio === 'mas-likes') {
        return (b.likes?.length || 0) - (a.likes?.length || 0);
      }
      return 0;
    });
  });

  postForm = this.fb.group({
    titulo: ['', [Validators.required, Validators.maxLength(100)]],
    descripcion: ['', [Validators.required, Validators.maxLength(500)]]
  });

  constructor() {
    this.cargarPosts();
  }

  ngOnInit() {
    this.cargarPosts();
    this.iniciarTemporizadorSesion(); // Iniciamos el temporizador real
  }

  ngOnDestroy() {
    this.limpiarTemporizador();
  }

  // --- SPRINT 3: Métodos de control de sesión ---
  iniciarTemporizadorSesion() {
    this.limpiarTemporizador();
    this.timerSesion = setTimeout(() => {
      this.mostrarModalSesion.set(true); // Actualizamos la signal a true
    }, this.tiempoAvisoMs);
  }

  limpiarTemporizador() {
    if (this.timerSesion) {
      clearTimeout(this.timerSesion);
    }
  }

  extenderSesion() {
    this.authService.refrescarToken().subscribe({
      next: (res) => {
        localStorage.setItem('biblioteca-token', res.access_token); 
        this.mostrarModalSesion.set(false); // Ocultamos el modal
        this.iniciarTemporizadorSesion(); // Reiniciamos el temporizador
      },
      error: () => {
        this.logout();
      }
    });
  }
  // ---------------------------------------------

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

  cambiarOrden(nuevoCriterio: 'antiguas' | 'recientes' | 'menos-likes' | 'mas-likes') {
    this.criterioOrden.set(nuevoCriterio);
  }
  
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