import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Post, PostService } from '../../../../core/services/post.service';
import { apiError } from '../../../../core/services/api-error';

@Component({
  selector: 'app-publicacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './publicacion.html',
  styleUrl: './publicacion.css',
})
export class PublicacionComponent {
  @Input({ required: true }) post!: Post;
  @Output() postActualizado = new EventEmitter<Post>();

  private postService = inject(PostService);

  darLike(postId: string) {
    this.postService.toggleLike(postId).subscribe({
      next: (postModificado) => {
        this.postActualizado.emit(postModificado);
      },
      error: (err) => alert(apiError(err))
    });
  }

  enviarComentario(postId: string, event: Event) {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const input = form.elements.namedItem('textoComentario') as HTMLInputElement;
    const texto = input.value;

    if (!texto.trim()) return;

    this.postService.comentar(postId, texto).subscribe({
      next: (postModificado) => {
        this.postActualizado.emit(postModificado);
        form.reset();
      },
      error: (err) => alert(apiError(err))
    });
  }
}