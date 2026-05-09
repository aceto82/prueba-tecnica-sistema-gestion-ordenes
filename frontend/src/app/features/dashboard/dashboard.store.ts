import { Injectable, computed, inject, signal } from '@angular/core';
import { DashboardService, DashboardStats } from './dashboard.service';

@Injectable({ providedIn: 'root' })
export class DashboardStore {
  private readonly dashboardService = inject(DashboardService);

  private readonly _stats = signal<DashboardStats | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly _error = signal<string | null>(null);

  readonly stats = this._stats.asReadonly();
  readonly loading = this._loading.asReadonly();
  readonly error = this._error.asReadonly();

  readonly totalOrders = computed(() => this._stats()?.totalOrders ?? 0);
  readonly totalRevenue = computed(() => this._stats()?.totalRevenue ?? 0);
  
  readonly pendingCount = computed(() => 
    this._stats()?.ordersByStatus['PENDING'] ?? 0
  );
  
  readonly processingCount = computed(() => 
    this._stats()?.ordersByStatus['PROCESSING'] ?? 0
  );
  
  readonly completedCount = computed(() => 
    this._stats()?.ordersByStatus['COMPLETED'] ?? 0
  );

  loadStats(): void {
    this._loading.set(true);
    this._error.set(null);
    
    this.dashboardService.getStats().subscribe({
      next: (stats) => {
        this._stats.set(stats);
        this._loading.set(false);
      },
      error: (err) => {
        this._error.set('Failed to load dashboard stats');
        this._loading.set(false);
      }
    });
  }
}