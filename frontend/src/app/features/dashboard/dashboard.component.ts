import { ChangeDetectionStrategy, Component, OnInit, inject, AfterViewInit, ElementRef, ViewChild, effect } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { DashboardStore } from './dashboard.store';
import { CardComponent } from '../../shared/components';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe, CardComponent],
  template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      
      @if (store.loading()) {
        <p>Loading...</p>
      }
      
      @if (store.error(); as error) {
        <p class="error">{{ error }}</p>
      }
      
      @if (store.stats(); as stats) {
        <!-- KPI Cards -->
        <div class="kpi-cards">
          <app-card class="kpi-card" padding="lg">
            <h3>Total Orders</h3>
            <p class="kpi-value">{{ store.totalOrders() }}</p>
          </app-card>
          <app-card class="kpi-card" padding="lg">
            <h3>Pending</h3>
            <p class="kpi-value pending">{{ store.pendingCount() }}</p>
          </app-card>
          <app-card class="kpi-card" padding="lg">
            <h3>Processing</h3>
            <p class="kpi-value processing">{{ store.processingCount() }}</p>
          </app-card>
          <app-card class="kpi-card" padding="lg">
            <h3>Completed</h3>
            <p class="kpi-value completed">{{ store.completedCount() }}</p>
          </app-card>
        </div>

        <!-- Chart -->
        <app-card class="chart-container" padding="lg">
          <h2>Orders by Status</h2>
          <canvas #chartCanvas></canvas>
        </app-card>

        <!-- Revenue -->
        <app-card padding="lg" style="text-align: center;">
          <h3>Total Revenue</h3>
          <p class="kpi-value">\${{ store.totalRevenue() | number:'1.2-2' }}</p>
        </app-card>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      padding: var(--space-lg);
    }
    h1 {
      margin-bottom: var(--space-lg);
      color: var(--color-text);
    }
    .kpi-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: var(--space-lg);
      margin-bottom: var(--space-xl);
    }
    .kpi-card {
      text-align: center;
    }
    .kpi-card h3 {
      margin: 0 0 var(--space-sm) 0;
      font-size: 14px;
      color: var(--color-text-secondary);
    }
    .kpi-value {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
      color: var(--color-text);
    }
    .kpi-value.pending { color: var(--color-warning); }
    .kpi-value.processing { color: var(--color-info); }
    .kpi-value.completed { color: var(--color-success); }
    .error {
      color: var(--color-danger);
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit {
  readonly store = inject(DashboardStore);

  @ViewChild('chartCanvas') chartCanvas!: ElementRef<HTMLCanvasElement>;
  private chart: Chart | null = null;

  constructor() {
    // effect() must be called inside an injection context (constructor)
    effect(() => {
      const stats = this.store.stats();
      if (stats && this.chartCanvas) {
        this.createChart(stats.ordersByStatus);
      }
    });
  }

  ngOnInit(): void {
    this.store.loadStats();
  }

  ngAfterViewInit(): void {
    // Chart creation is handled reactively by the effect in the constructor
  }

  private createChart(ordersByStatus: Record<string, number>): void {
    const labels = Object.keys(ordersByStatus);
    const data = Object.values(ordersByStatus);
    const colors = ['#ff9800', '#2196f3', '#4caf50', '#f44336'];

    this.chart = new Chart(this.chartCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Orders',
          data: data,
          backgroundColor: colors,
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: false
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1
            }
          }
        }
      }
    });
  }
}
