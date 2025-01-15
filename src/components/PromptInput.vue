<template>
  <div class="space-y-4">
    <!-- Custom Prompt Input -->
      <textarea
      v-model="promptText"
      @input="emitPrompt"
      class="p-3 w-full rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500"
      placeholder="Enter your analysis request or select from suggestions below"
      rows="3"
      ></textarea>
      
    <!-- Suggested Prompts -->
    <div class="space-y-2">
      <p class="text-sm font-medium text-gray-700">Suggested Analyses:</p>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <button
          v-for="(prompt, index) in suggestedPrompts"
          :key="index"
          @click="selectPrompt(prompt)"
          class="p-2 text-sm text-left text-gray-700 rounded-md transition-colors hover:bg-blue-50"
        >
          {{ prompt.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      promptText: '',
      suggestedPrompts: [
        {
          label: 'Claims Value Analysis',
          prompt: 'Analyze claims metrics showing \n1. submitted claims value vs approved amounts, \n2. savings achieved for each provider, \n3. prominent rejection reasons along with cost saved',
          structure: {
            type: 'claims_value',
            metrics: {
              primary: [
                'submitted_claims',
                'approved_claims', 
                'savings',
                'rejection_reasons',
                'provider_savings'
              ],
              aggregations: {
                by_provider: ['savings', 'approval_rate'],
                by_reason: ['count', 'value_saved']
              },
              compare: 'month_over_month'
            },
            visualization: {
              layout: {
                metrics: [
                  {
                    title: 'Value of Submitted Claims',
                    format: 'currency',
                    prefix: 'KES',
                    suffix: 'Million',
                    highlight: true,
                    comparison: {
                      type: 'percentage',
                      label: 'from last month'
                    }
                  },
                  {
                    title: 'Value of Savings',
                    format: 'currency',
                    prefix: 'KES',
                    value_type: 'exact'
                  },
                  {
                    title: 'Percentage Saved',
                    format: 'percentage',
                    highlight: true
                  }
                ],
                charts: [
                  {
                    title: 'Claims Value Analysis',
                    type: 'bar',
                    stacked: false,
                    colors: ['#6B9AC4', '#1B365C'],
                    labels: {
                      approved: 'Amount Approved',
                      requested: 'Amount Requested'
                    },
                    yAxis: {
                      format: 'currency',
                      steps: 100000000,
                      max: 500000000
                    }
                  },
                  {
                    title: 'Provider-wise Savings Distribution',
                    type: 'bar',
                    stacked: true,
                    colors: ['#10B981', '#059669', '#047857'],
                    limit: 10,
                    sort: 'desc',
                    yAxis: {
                      format: 'currency'
                    }
                  },
                  {
                    title: 'Top Rejection Reasons & Associated Savings',
                    type: 'bar',
                    stacked: true,
                    horizontal: true,
                    colors: ['#EF4444', '#DC2626', '#B91C1C'],
                    limit: 5,
                    sort: 'value',
                    metrics: ['count', 'value_saved'],
                    labels: {
                      count: 'Number of Rejections',
                      value_saved: 'Value Saved (KES)'
                    }
                  }
                ]
              }
            },
            analysis: {
              focus_areas: [
                'claims_value_comparison',
                'provider_savings_distribution',
                'rejection_patterns'
              ],
              required_insights: [
                'top_saving_providers',
                'major_rejection_categories',
                'cost_saving_opportunities'
              ],
              thresholds: {
                significant_variance: 0.15,
                high_rejection_rate: 0.25,
                notable_saving: 1000000
              }
            }
          }
        },
        {
          label: 'Provider Performance Dashboard',
          prompt: 'Create a comprehensive view of provider performance metrics and rankings.',
          structure: {
            type: 'provider_metrics',
            chartType: 'bar',
            metrics: {
              primary: ['total_providers', 'active_providers'],
              secondary: ['claims_volume', 'approval_rate', 'avg_value'],
              limit: 5
            },
            visualization: {
              multiChart: true,
              charts: [
                {
                  type: 'bar',
                  metric: 'claims_volume',
                  colors: ['#4F46E5', '#7C3AED', '#EC4899', '#F59E0B', '#10B981'],
                  title: 'Top 5 Providers by Claims Volume'
                },
                {
                  type: 'line',
                  metric: 'approval_rate',
                  title: 'Approval Rates Trend'
                }
              ]
            }
          }
        },
        {
          label: 'Top Provider Analysis',
          prompt: 'Deep dive into top 5 providers performance trends and patterns.',
          structure: {
            type: 'provider_trends',
            chartType: 'line',
            metrics: {
              primary: ['claims_volume', 'approval_rate', 'avg_claim_value'],
              timeframe: 'last_6_months',
              providers: 'top_5'
            },
            visualization: {
              multiLine: true,
              showLegend: true,
              annotations: {
                highlight_anomalies: true,
                trend_lines: true
              },
              comparisons: {
                benchmark: 'average',
                show_variance: true
              }
            }
          }
        },
        {
          label: 'Claims Processing Efficiency',
          prompt: 'Analyze claims processing efficiency metrics and bottlenecks.',
          structure: {
            type: 'processing_efficiency',
            chartType: 'mixed',
            metrics: {
              primary: ['processing_time', 'approval_rate', 'rejection_reasons'],
              timeframe: 'daily'
            },
            visualization: {
              charts: [
                {
                  type: 'line',
                  metric: 'processing_time',
                  title: 'Processing Time Trend'
                },
                {
                  type: 'pie',
                  metric: 'rejection_reasons',
                  title: 'Rejection Distribution'
                }
              ]
            }
          }
        },
        {
          label: 'Value Recovery Analysis',
          prompt: 'Analyze patterns in value saved through claims processing.',
          structure: {
            type: 'value_recovery',
            chartType: 'area',
            metrics: {
              primary: ['potential_savings', 'actual_savings', 'recovery_rate'],
              breakdown: ['category', 'provider']
            },
            visualization: {
              stacked: true,
              showPercentages: true,
              cumulative: true,
              annotations: {
                highlight_opportunities: true
              }
            }
          }
        }
      ]
    }
  },
  methods: {
    emitPrompt() {
      this.$emit('promptUpdated', this.promptText)
    },
    selectPrompt(prompt) {
      this.promptText = prompt.prompt
      this.$emit('clearResults')
      this.$emit('promptUpdated', prompt.prompt, prompt.structure)
    }
  }
}
</script>