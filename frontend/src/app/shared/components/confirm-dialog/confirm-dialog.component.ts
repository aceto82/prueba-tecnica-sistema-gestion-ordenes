import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { ModalComponent } from '../modal/modal.component';

export type ConfirmVariant = 'primary' | 'danger';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ModalComponent],
  template: `
    <app-modal
      [open]="open"
      [title]="title"
      size="sm"
      (closed)="onCancel()"
    >
      <p>{{ message }}</p>
      <div class="confirm-actions">
        <button class="btn btn--outline" (click)="onCancel()">{{ cancelLabel }}</button>
        <button
          class="btn btn--{{ variant === 'danger' ? 'danger' : 'primary' }}"
          (click)="onConfirm()"
        >
          {{ confirmLabel }}
        </button>
      </div>
    </app-modal>
  `,
  styles: [`
    .confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: var(--space-sm);
      margin-top: var(--space-lg);
    }
  `],
})
export class ConfirmDialogComponent {
  @Input() open = false;
  @Input() title = 'Confirm';
  @Input() message = '';
  @Input() confirmLabel = 'Confirm';
  @Input() cancelLabel = 'Cancel';
  @Input() variant: ConfirmVariant = 'primary';
  @Output() confirmed = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  onConfirm(): void {
    this.confirmed.emit();
  }

  onCancel(): void {
    this.cancelled.emit();
  }
}
