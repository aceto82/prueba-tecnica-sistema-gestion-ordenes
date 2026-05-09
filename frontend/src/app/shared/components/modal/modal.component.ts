import { ChangeDetectionStrategy, Component, effect, ElementRef, EventEmitter, Input, Output, inject } from '@angular/core';

export type ModalSize = 'sm' | 'md' | 'lg';

@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="modal" [class]="'modal--' + size" (click)="onBackdropClick($event)">
      <div class="modal__content" (click)="$event.stopPropagation()">
        <div class="modal__header">
          <h2 class="modal__title">{{ title }}</h2>
          <button class="modal__close" (click)="close()">&times;</button>
        </div>
        <div class="modal__body">
          <ng-content />
        </div>
      </div>
    </dialog>
  `,
  styles: [`
    .modal {
      border: none;
      border-radius: var(--radius-md);
      padding: 0;
      background: var(--color-surface);
      color: var(--color-text);
      box-shadow: var(--shadow-lg);
      max-height: 80vh;
      overflow: hidden;
      &::backdrop { background: var(--color-overlay); }
    }
    .modal--sm { width: 320px; }
    .modal--md { width: 480px; }
    .modal--lg { width: 640px; }
    .modal__content { display: flex; flex-direction: column; }
    .modal__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: var(--space-md) var(--space-lg);
      border-bottom: 1px solid var(--color-border-light);
    }
    .modal__title {
      font-size: var(--font-size-lg);
      font-weight: var(--font-weight-semibold);
      margin: 0;
    }
    .modal__close {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: var(--color-text-muted);
      padding: 0;
      line-height: 1;
      &:hover { color: var(--color-text); }
    }
    .modal__body {
      padding: var(--space-lg);
      overflow-y: auto;
    }
  `],
})
export class ModalComponent {
  private readonly elementRef = inject(ElementRef);

  @Input() open = false;
  @Input() title = '';
  @Input() size: ModalSize = 'md';
  @Output() closed = new EventEmitter<void>();

  private dialogEl: HTMLDialogElement | null = null;

  constructor() {
    effect(() => {
      if (this.open) {
        this.show();
      } else {
        this.close();
      }
    });
  }

  private getDialog(): HTMLDialogElement | null {
    if (!this.dialogEl) {
      this.dialogEl = this.elementRef.nativeElement.querySelector('dialog');
    }
    return this.dialogEl;
  }

  private show(): void {
    const dialog = this.getDialog();
    if (dialog && !dialog.open) {
      if (typeof dialog.showModal === 'function') {
        dialog.showModal();
      }
      dialog.addEventListener('close', () => this.onDialogClose(), { once: true });
    }
  }

  close(): void {
    const dialog = this.getDialog();
    if (dialog?.open) {
      if (typeof dialog.close === 'function') {
        dialog.close();
      }
    }
  }

  private onDialogClose(): void {
    this.closed.emit();
  }

  onBackdropClick(event: MouseEvent): void {
    const dialog = this.getDialog();
    if (event.target === dialog) {
      this.close();
    }
  }
}
