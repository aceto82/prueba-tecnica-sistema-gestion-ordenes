import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, inject, forwardRef } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, ReactiveFormsModule } from '@angular/forms';

export interface SelectOption {
  value: string | number;
  label: string;
}

@Component({
  selector: 'app-select',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => SelectComponent),
      multi: true,
    },
  ],
  template: `
    <div class="form-group">
      @if (label) {
        <label [for]="id">{{ label }}</label>
      }
      <select
        [id]="id"
        [disabled]="disabled"
        [class.form-control--error]="!!error"
        class="form-control"
        [value]="value"
        (change)="onChange($event)"
        (blur)="onBlur()"
      >
        @if (placeholder) {
          <option value="">{{ placeholder }}</option>
        }
        @for (opt of options; track opt.value) {
          <option [value]="opt.value">{{ opt.label }}</option>
        }
      </select>
      @if (error) {
        <p class="field-error">{{ error }}</p>
      }
    </div>
  `,
})
export class SelectComponent implements ControlValueAccessor {
  private readonly cdr = inject(ChangeDetectorRef);

  @Input() label = '';
  @Input() options: SelectOption[] = [];
  @Input() placeholder = '';
  @Input() error: string | null = null;
  @Input() disabled = false;
  @Input() id = '';

  value: string | number = '';

  private readonly cdr = inject(ChangeDetectorRef);
  private onChangeFn: (value: string | number) => void = () => {};
  private onTouchedFn: () => void = () => {};

  writeValue(value: string | number): void {
    this.value = value ?? '';
    this.cdr.markForCheck();
  }

  registerOnChange(fn: (value: string | number) => void): void {
    this.onChangeFn = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouchedFn = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled = isDisabled;
  }

  onChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.value = target.value;
    this.onChangeFn(this.value);
  }

  onBlur(): void {
    this.onTouchedFn();
  }
}
