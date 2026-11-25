import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-session-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay">
      <div class="modal-content">
        <h3>⚠️ Sesión a punto de expirar</h3>
        <p>Tu sesión está por caducar por motivos de seguridad. ¿Deseás extenderla?</p>
        <div class="modal-actions">
          <button class="btn-extender" (click)="extender.emit()">Extender Sesión</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-overlay {
      position: fixed;
      top: 0; left: 0; width: 100%; height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex; justify-content: center; align-items: center;
      z-index: 1000;
    }
    .modal-content {
      background: white; padding: 2rem; border-radius: 12px;
      text-align: center; max-width: 400px; width: 90%;
      box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    }
    .modal-content h3 { margin-top: 0; color: #2c3e50; }
    .modal-content p { color: #555; font-size: 0.95rem; margin-bottom: 1.5rem; }
    .modal-actions { display: flex; gap: 10px; justify-content: center; }
    .btn-extender {
      background: #2ecc71; color: white; border: none; padding: 8px 16px;
      border-radius: 6px; font-weight: 600; cursor: pointer;
    }
    .btn-extender:hover { background: #27ae60; }
    .btn-salir {
      background: #e74c3c; color: white; border: none; padding: 8px 16px;
      border-radius: 6px; font-weight: 600; cursor: pointer;
    }
    .btn-salir:hover { background: #c0392b; }
  `]
})
export class SessionModalComponent {
  @Output() extender = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();
}