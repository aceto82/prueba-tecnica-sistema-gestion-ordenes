import { ChangeDetectionStrategy, Component, OnInit, inject, AfterViewInit, ElementRef, ViewChild, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DashboardStore } from './dashboard.store';
import Chart from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
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
          <div class="kpi-card">
            <h3>Total Orders</h3>
            <p class="kpi-value">{{ store.totalOrders() }}</p>
          </div>
          <div class="kpi-card">
            <h3>Pending</h3>
            <p class="kpi-value pending">{{ store.pendingCount() }}</p>
          </div>
          <div class="kpi-card">
            <h3>Processing</h3>
            <p class="kpi-value processing">{{ store.processingCount() }}</p>
          </div>
          <div class="kpi-card">
            <h3>Completed</h3>
            <p class="kpi-value completed">{{ store.completedCount() }}</p>
          </div>
        </div>

        <!-- Chart -->
        <div class="chart-container">
          <h2>Orders by Status</h2>
          <canvas #chartCanvas></canvas>
        </div>

        <!-- Revenue -->
        <div class="revenue-card">
          <h3>Total Revenue</h3>
          <p class="kpi-value">\${{ store.totalRevenue() | number:'1.2-2' }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 20px;
    }
    h1 {
      margin-bottom: 20px;
    }
    .kpi-cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }
    .kpi-card {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .kpi-card h3 {
      margin: 0 0 10px 0;
      font-size: 14px;
      color: #666;
    }
    .kpi-value {
      font-size: 32px;
      font-weight: bold;
      margin: 0;
    }
    .kpi-value.pending { color: #ff9800; }
    .kpi-value.processing { color: #2196f3; }
    .kpi-value.completed { color: #4caf50; }
    .chart-container {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      margin-bottom: 20px;
    }
    .chart-container h2 {
      margin-top: 0;
    }
    .revenue-card {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      text-align: center;
    }
    .error {
      color: #f44336;
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