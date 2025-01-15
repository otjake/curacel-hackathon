<template>
  <div class="chart-container">
    <!-- Error State -->
    <div v-if="!chartData" class="p-4 text-gray-600">
      No chart data available
    </div>
    
    <!-- Single Chart View -->
    <component 
      v-else-if="!isMultiChart && validateChartData(chartData)"
      :is="chartComponent" 
      :data="processedChartData" 
      :options="chartOptions"
      ref="chart"
    />

    <!-- Multi Chart View -->
    <div v-else-if="isMultiChart && structure?.visualization?.charts" class="grid gap-6 md:grid-cols-2">
      <div v-for="(chart, index) in structure.visualization.charts" :key="index" class="chart-wrapper">
        <h4 class="mb-2 text-sm font-medium text-gray-700">{{ chart.title }}</h4>
        <component 
          v-if="validateChartData(getChartData(chart))"
          :is="getChartComponent(chart.type)"
          :data="getChartData(chart)"
          :options="getChartOptions(chart)"
          :ref="`chart-${index}`"
        />
      </div>
    </div>

    <!-- Invalid Data State -->
    <div v-else class="p-4 text-red-600">
      Invalid chart configuration
    </div>

    <!-- Add download buttons -->
    <div v-if="canDownload" class="flex justify-end mt-4 space-x-2">
      <button 
        @click="downloadChart('png')"
        class="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded transition-colors hover:bg-blue-700"
      >
        Download PNG
      </button>
      <button 
        @click="downloadChart('jpg')"
        class="px-3 py-1 text-sm font-medium text-white bg-green-600 rounded transition-colors hover:bg-green-700"
      >
        Download JPG
      </button>
    </div>
  </div>
</template>

<script>
import {
  Chart as ChartJS,
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler
} from 'chart.js'
import { Bar, Line, Pie, Doughnut, Radar } from 'vue-chartjs'

ChartJS.register(
  Title,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  RadialLinearScale,
  Filler
)

// Define color palettes outside the component
const colorPalettes = {
  primary: [
    '#FF4D4D', // Bright Red
    '#4D7FFF', // Bright Blue
    '#FFD700', // Gold
    '#32CD32', // Lime Green
    '#FF1493'  // Deep Pink
  ],
  secondary: [
    '#8A2BE2', // Blue Violet
    '#00FA9A', // Medium Spring Green
    '#FF6347', // Tomato
    '#4169E1', // Royal Blue
    '#FFB6C1'  // Light Pink
  ],
  accent: [
    '#FF8C00', // Dark Orange
    '#00CED1', // Dark Turquoise
    '#FF69B4', // Hot Pink
    '#7B68EE', // Medium Slate Blue
    '#20B2AA'  // Light Sea Green
  ]
};

export default {
  name: 'DataChart',
  components: { 
    Bar, 
    Line, 
    Pie, 
    Doughnut, 
    Radar 
  },
  data() {
    return {
      colorPalettes,
      _memoized: {},
    }
  },
  props: {
    chartData: {
      type: Object,
      required: true
    },
    chartType: {
      type: String,
      default: 'bar'
    },
    structure: {
      type: Object,
      default: () => ({})
    }
  },
  computed: {
    isMultiChart() {
      return this.structure?.visualization?.multiChart || false
    },
    chartComponent() {
      const components = {
        bar: 'Bar',
        line: 'Line',
        pie: 'Pie',
        doughnut: 'Doughnut',
        radar: 'Radar',
        area: 'Line'
      }
      return components[this.chartType] || 'Bar'
    },
    computedOptions() {
      return {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              font: {
                family: "'Arial', sans-serif",
                size: 14,
                weight: 'bold'
              },
              padding: 20,
              usePointStyle: true,
              pointStyle: 'rectRounded'
            }
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            titleFont: {
              size: 14,
              weight: 'bold'
            },
            bodyFont: {
              size: 13
            },
            padding: 12,
            cornerRadius: 4,
            displayColors: true
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            grid: {
              display: true,
              color: 'rgba(0, 0, 0, 0.1)',
              lineWidth: 1
            },
            ticks: {
              font: {
                size: 12,
                weight: '600'
              },
              padding: 8,
              callback: function(value) {
                return value.toLocaleString('en-KE');
              }
            }
          },
          x: {
            grid: {
              display: false
            },
            ticks: {
              font: {
                size: 12,
                weight: '600'
              },
              padding: 8
            }
          }
        }
      };
    },
    canDownload() {
      return this.chartData && this.chartData.labels && this.chartData.datasets;
    },
    chartOptions() {
      // Memoize chart options
      return this.memoize('chartOptions', () => this.computedOptions);
    },
    processedChartData() {
      // Memoize chart data processing
      return this.memoize('chartData', () => 
        this.isMultiChart ? null : this.getChartData({ metric: null }));
    }
  },
  methods: {
    getChartComponent(type) {
      const components = {
        bar: 'Bar',
        line: 'Line',
        pie: 'Pie',
        doughnut: 'Doughnut',
        radar: 'Radar',
        area: 'Line'
      }
      return components[this.chartType] || 'Bar'
    },
    getChartData(chart) {
      try {
        if (!this.chartData || !this.chartData.datasets) {
          return { labels: [], datasets: [] };
        }

        const defaultColors = this.chartType === 'bar' 
          ? this.colorPalettes.primary
          : this.chartType === 'line' 
            ? this.colorPalettes.secondary 
            : this.colorPalettes.accent;

        return {
          labels: this.chartData.labels || [],
          datasets: this.chartData.datasets
            .filter(ds => ds.metric === chart.metric || !chart.metric)
            .map((ds, index) => ({
              ...ds,
              backgroundColor: defaultColors[index % defaultColors.length],
              borderColor: this.chartType !== 'bar' 
                ? defaultColors[index % defaultColors.length]
                : undefined,
              borderWidth: 0,
              borderRadius: this.chartType === 'bar' ? 4 : 0,
              barThickness: 30,
              maxBarThickness: 50,
              minBarLength: 4,
              categoryPercentage: 0.8,
              barPercentage: 0.9,
              fill: this.chartType === 'area',
              tension: 0.4,
              pointStyle: 'circle',
              pointRadius: 6,
              pointHoverRadius: 10,
              pointBackgroundColor: defaultColors[index % defaultColors.length],
              pointBorderColor: defaultColors[index % defaultColors.length],
              pointBorderWidth: 2,
              hoverBackgroundColor: defaultColors[(index + 1) % defaultColors.length],
              hoverBorderColor: defaultColors[index % defaultColors.length],
              hoverBorderWidth: 2,
              // Add gradient for area charts
              ...(this.chartType === 'area' && {
                backgroundColor: (context) => {
                  const chart = context.chart;
                  const {ctx, chartArea} = chart;
                  if (!chartArea) return null;
                  
                  const gradient = ctx.createLinearGradient(0, chartArea.bottom, 0, chartArea.top);
                  const color = defaultColors[index % defaultColors.length];
                  gradient.addColorStop(0, `${color}33`);
                  gradient.addColorStop(1, `${color}BB`);
                  return gradient;
                }
              })
            }))
        };
      } catch (error) {
        console.error('Error processing chart data:', error);
        return { labels: [], datasets: [] };
      }
    },
    getChartOptions(chart) {
      const options = {
        ...this.computedOptions,
        plugins: {
          ...this.computedOptions.plugins,
          title: {
            display: true,
            text: chart.title
          }
        }
      };

      // Adjust options based on chart type
      if (this.chartType === 'bar') {
        options.scales = {
          ...options.scales,
          y: {
            ...options.scales.y,
            beginAtZero: true,
            grid: {
              drawBorder: true,
              color: 'rgba(0, 0, 0, 0.1)'
            }
          }
        };
      }

      return options;
    },
    calculateTrendLine(data) {
      if (!data || !data.length) return { min: 0, max: 0 };

      const points = data.map((val, i) => ({ x: i, y: val }));
      const n = points.length;
      
      // Calculate means
      const meanX = points.reduce((sum, p) => sum + p.x, 0) / n;
      const meanY = points.reduce((sum, p) => sum + p.y, 0) / n;
      
      // Calculate coefficients
      let numerator = 0;
      let denominator = 0;
      
      points.forEach(point => {
        const xDiff = point.x - meanX;
        numerator += xDiff * (point.y - meanY);
        denominator += xDiff * xDiff;
      });
      
      const slope = denominator !== 0 ? numerator / denominator : 0;
      const intercept = meanY - slope * meanX;
      
      // Calculate trend line points
      return {
        min: intercept,
        max: slope * (n - 1) + intercept
      };
    },
    generateAnnotations() {
      const annotations = {};
      
      if (this.structure?.visualization?.annotations) {
        // Add trend lines if requested
        if (this.structure.visualization.annotations.trend_lines) {
          this.chartData.datasets.forEach((dataset, index) => {
            const trendLine = this.calculateTrendLine(dataset.data);
            annotations[`trendLine${index}`] = {
              type: 'line',
              yMin: trendLine.min,
              yMax: trendLine.max,
              xMin: 0,
              xMax: dataset.data.length - 1,
              borderColor: this.getTrendLineColor(dataset.backgroundColor || '#4F46E5'),
              borderWidth: 2,
              borderDash: [6, 6],
              label: {
                content: `${dataset.label} Trend`,
                enabled: true,
                position: 'start'
              }
            };
          });
        }

        // Add anomaly highlights if requested
        if (this.structure.visualization.annotations.highlight_anomalies) {
          this.chartData.datasets.forEach((dataset, datasetIndex) => {
            const anomalies = this.detectAnomalies(dataset.data);
            anomalies.forEach((point, index) => {
              annotations[`anomaly${datasetIndex}-${index}`] = {
                type: 'point',
                xValue: point.index,
                yValue: point.value,
                backgroundColor: 'rgba(255, 99, 132, 0.25)',
                borderColor: 'rgba(255, 99, 132, 0.8)',
                borderWidth: 2,
                radius: 8,
                label: {
                  content: 'Anomaly Detected',
                  enabled: true,
                  position: 'top'
                }
              };
            });
          });
        }
      }

      return annotations;
    },
    detectAnomalies(data) {
      if (!data || data.length < 4) return [];

      const anomalies = [];
      const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
      const stdDev = Math.sqrt(
        data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length
      );
      
      // Define threshold for anomaly (2 standard deviations)
      const threshold = stdDev * 2;

      data.forEach((value, index) => {
        if (Math.abs(value - mean) > threshold) {
          anomalies.push({ index, value });
        }
      });

      return anomalies;
    },
    getTrendLineColor(baseColor) {
      try {
        // Handle array of colors
        if (Array.isArray(baseColor)) {
          baseColor = baseColor[0];
        }

        // Handle undefined or null
        if (!baseColor) {
          return 'rgba(79, 70, 229, 0.5)'; // default color
        }

        // Handle hex colors
        if (typeof baseColor === 'string' && baseColor.startsWith('#')) {
          const r = parseInt(baseColor.slice(1, 3), 16);
          const g = parseInt(baseColor.slice(3, 5), 16);
          const b = parseInt(baseColor.slice(5, 7), 16);
          return `rgba(${r}, ${g}, ${b}, 0.5)`;
        }

        // Handle rgb/rgba colors
        if (typeof baseColor === 'string' && baseColor.startsWith('rgb')) {
          return baseColor.replace('rgb', 'rgba').replace(')', ', 0.5)');
        }

        // Return default if color format is not recognized
        return 'rgba(79, 70, 229, 0.5)';
      } catch (error) {
        console.error('Error processing color:', error);
        return 'rgba(79, 70, 229, 0.5)'; // fallback color
      }
    },
    validateChartData(data) {
      try {
        if (!data) {
          return false;
        }
        if (!data.labels || !Array.isArray(data.labels)) {
          return false;
        }
        if (!data.datasets || !Array.isArray(data.datasets)) {
          return false;
        }
        // Check if datasets have required properties
        return data.datasets.every(dataset => 
          dataset.hasOwnProperty('label') && 
          Array.isArray(dataset.data) &&
          dataset.data.length > 0
        );
      } catch (error) {
        console.error('Error validating chart data:', error);
        return false;
      }
    },
    downloadChart(format = 'png') {
      try {
        let canvas;
        if (this.isMultiChart) {
          // Get the first valid chart canvas for multi-chart view
          const charts = Object.keys(this.$refs)
            .filter(key => key.startsWith('chart-'))
            .map(key => this.$refs[key][0]);
          
          canvas = charts[0]?.chart?.canvas;
        } else {
          // Get single chart canvas
          canvas = this.$refs.chart?.chart?.canvas;
        }

        if (!canvas) {
          console.error('Chart canvas not found');
          return;
        }

        // Create a temporary link
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        
        if (format === 'png') {
          link.download = `chart-${timestamp}.png`;
          link.href = canvas.toDataURL('image/png');
        } else if (format === 'jpg') {
          link.download = `chart-${timestamp}.jpg`;
          link.href = canvas.toDataURL('image/jpeg', 0.8);
        }
        
        // Trigger download
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (error) {
        console.error('Error downloading chart:', error);
      }
    },
    memoize(key, callback) {
      if (!this._memoized) this._memoized = {};
      if (!this._memoized[key]) {
        this._memoized[key] = callback();
      }
      return this._memoized[key];
    },
    clearMemoization() {
      this._memoized = {};
    }
  }
}
</script>

<style scoped>
.chart-container {
  background: #FFFFFF;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  height: 400px;
  max-height: 400px;
  margin-bottom: 1rem;
}

.chart-wrapper {
  height: 350px;
  max-height: 350px;
  background: #FFFFFF;
  border-radius: 8px;
  padding: 1rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

@media (max-width: 768px) {
  .chart-container {
    height: 350px;
    max-height: 350px;
  }
  
  .chart-wrapper {
    height: 300px;
    max-height: 300px;
  }
}

@media (max-width: 640px) {
  .chart-container {
    height: 300px;
    max-height: 300px;
  }
  
  .chart-wrapper {
    height: 250px;
    max-height: 250px;
  }
}
</style> 