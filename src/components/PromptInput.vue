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
          prompt: `Analyze claims for the top 5 providers by total sum of "Amount Submitted", generating separate charts for each of the following metrics:
1. A comparison of submitted claims value ("Sum of Amount Submitted") against approved amounts ("Sum of Amount Approved") for each provider.
2. Savings achieved (sum of Amount Submitted - sum of Amount Approved) by each provider
3. Top rejection reasons with associated cost savings
Ensure each metric has its own distinct chart for clarity.`,
          structure: {
            type: 'claims_value',
            metrics: {
              primary: [
                'submitted_claims',
                'approved_claims', 
                'savings',
                'rejection_reasons'
              ],
              aggregations: {
                by_provider: {
                  group_by: 'Provider Name',
                  metrics: [
                    { 
                      field: 'Amount Submitted', 
                      alias: 'total_submitted',
                      aggregation: 'sum',
                      label: 'Total Amount Submitted'
                    },
                    { 
                      field: 'Amount Approved', 
                      alias: 'total_approved',
                      aggregation: 'sum',
                      label: 'Total Amount Approved'
                    },
                    { 
                      calculation: 'SUM(Amount Submitted) - SUM(Amount Approved)',
                      alias: 'total_savings',
                      label: 'Total Savings'
                    }
                  ],
                  sort: {
                    field: 'total_submitted',
                    order: 'desc'
                  },
                  limit: 5
                }
              }
            },
            visualization: {
              charts: [
                {
                  title: 'Total Claims Value by Provider',
                  type: 'bar',
                  stacked: false,
                  data: {
                    x: {
                      field: 'Provider Name',
                      type: 'category'
                    },
                    y: [
                      {
                        field: 'total_submitted',
                        label: 'Total Submitted Value',
                        format: 'currency'
                      },
                      {
                        field: 'total_approved',
                        label: 'Total Approved Value',
                        format: 'currency'
                      }
                    ]
                  },
                  colors: ['#FF4D4D', '#4D7FFF'],
                  yAxis: {
                    format: 'currency',
                    title: 'Total Amount in KES'
                  },
                  xAxis: {
                    title: 'Provider Name',
                    rotate: -45
                  }
                },
                {
                  title: 'Total Provider Savings',
                  type: 'bar',
                  horizontal: true,
                  data: {
                    x: {
                      field: 'Provider Name',
                      type: 'category'
                    },
                    y: {
                      field: 'total_savings',
                      label: 'Total Savings',
                      format: 'currency'
                    }
                  },
                  colors: ['#32CD32'],
                  xAxis: {
                    format: 'currency',
                    title: 'Total Savings in KES'
                  },
                  yAxis: {
                    title: 'Provider Name'
                  }
                }
              ]
            }
          }
        },
        {
          label: 'Provider Performance Dashboard',
          prompt: 'Analyze top 5 providers by total sum of "Amount Submitted", providers performance showing: \n1. Top 5 providers by claims volume \n2. approval rates for each provider \n3. Average claim value trends \n based on dataset provided.\n(Claim Item Comment column decides is approved)',
          structure: {
            type: 'provider_metrics',
            metrics: {
              primary: ['claims_volume', 'approval_rate', 'avg_claim_value'],
              aggregations: {
                by_provider: [
                  'total_claims',
                  'approved_claims',
                  'total_value',
                  'average_value'
                ],
                calculations: {
                  approval_rate: {
                    numerator: 'approved_claims',
                    denominator: 'total_claims',
                    format: 'percentage'
                  },
                  avg_claim_value: {
                    numerator: 'total_value',
                    denominator: 'total_claims',
                    format: 'currency'
                  }
                },
                filters: {
                  approved: {
                    field: 'Claim Item Comment',
                    values: ['APPROVED', 'OK BY HMO','APPROVED BY PRESET RULE']
                  }
                },
                limit: 5
              }
            },
            visualization: {
              multiChart: true,
              charts: [
                {
                  type: 'bar',
                  metric: 'claims_volume',
                  title: 'Top 5 Providers by Claims Volume',
                  colors: ['#FF4D4D'], // Bright Red
                  yAxis: {
                    title: 'Number of Claims',
                    format: 'number'
                  },
                  xAxis: {
                    title: 'Provider',
                    rotate: -45
                  },
                  sort: {
                    field: 'total_claims',
                    order: 'desc'
                  }
                },
                {
                  type: 'bar',
                  metric: 'approval_rate',
                  title: 'Provider Approval Rates',
                  colors: ['#32CD32'], // Lime Green
                  yAxis: {
                    title: 'Approval Rate',
                    format: 'percentage',
                    min: 0,
                    max: 100
                  },
                  xAxis: {
                    title: 'Provider',
                    rotate: -45
                  },
                  dataLabels: {
                    enabled: true,
                    format: '%.1f%%'
                  }
                },
                {
                  type: 'line',
                  metric: 'avg_claim_value',
                  title: 'Average Claim Value Trend by Provider',
                  colors: ['#4D7FFF', '#FF69B4', '#FFD700', '#00CED1', '#FF8C00'], // Bright colors
                  yAxis: {
                    title: 'Average Value (KES)',
                    format: 'currency'
                  },
                  xAxis: {
                    title: 'Month',
                    type: 'date',
                    source: 'Encounter Date'
                  },
                  legend: {
                    position: 'bottom'
                  }
                }
              ]
            },
            analysis: {
              focus_areas: [
                'volume_analysis',
                'approval_patterns',
                'value_trends'
              ],
              required_insights: [
                'top_volume_providers',
                'approval_rate_variations',
                'value_trend_patterns'
              ],
              thresholds: {
                high_volume: 100,
                low_approval: 0.8,
                significant_value_change: 0.2
              }
            }
          }
        },
        {
          label: 'Top Provider Analysis',
          prompt: 'Analyze top 5 providers by total sum of "Amount Submitted", based on the 3 categories below: \n1. claims volume trends \n2. Average claim value patterns \n3. Approval rate variations.\n based on dataset provided',
          structure: {
            type: 'provider_trends',
            metrics: {
              primary: ['claims_volume', 'avg_claim_value', 'approval_rate'],
              timeframe: {
                field: 'Encounter Date',
                grouping: 'monthly'
              },
              aggregations: {
                by_provider: {
                  dimensions: ['Provider Name'],
                  metrics: {
                    claims_volume: {
                      type: 'count',
                      distinct: 'Item ID'
                    },
                    total_value: {
                      type: 'sum',
                      field: 'Amount Submitted'
                    },
                    approved_value: {
                      type: 'sum',
                      field: 'Amount Approved',
                      filter: {
                        field: 'Claim Item Comment',
                        values: ['APPROVED', 'OK BY HMO']
                      }
                    }
                  },
                  calculations: {
                    avg_claim_value: {
                      numerator: 'total_value',
                      denominator: 'claims_volume',
                      format: 'currency'
                    },
                    approval_rate: {
                      numerator: 'approved_value',
                      denominator: 'total_value',
                      format: 'percentage'
                    }
                  },
                  limit: 5,
                  sort: {
                    field: 'claims_volume',
                    order: 'desc'
                  }
                }
              }
            },
            visualization: {
              multiChart: true,
              charts: [
                {
                  type: 'line',
                  metric: 'claims_volume',
                  title: 'Monthly Claims Volume by Provider',
                  colors: ['#FF3366', '#00E676', '#00B4DB', '#FFD93D', '#FF6B9B'], // Bright distinct colors
                  yAxis: {
                    title: 'Number of Claims',
                    format: 'number',
                    min: 0
                  },
                  xAxis: {
                    title: 'Month',
                    type: 'date',
                    source: 'Encounter Date',
                    format: 'MMM YYYY'
                  },
                  legend: {
                    position: 'bottom',
                    title: 'Providers'
                  },
                  dataLabels: {
                    enabled: true,
                    rotation: -45
                  }
                },
                {
                  type: 'line',
                  metric: 'avg_claim_value',
                  title: 'Average Claim Value Trends',
                  colors: ['#6C63FF', '#FF4081', '#FFA000', '#00BCD4', '#4CAF50'], // Vibrant colors
                  yAxis: {
                    title: 'Average Value (KES)',
                    format: 'currency',
                    min: 0
                  },
                  xAxis: {
                    title: 'Month',
                    type: 'date',
                    source: 'Encounter Date',
                    format: 'MMM YYYY'
                  },
                  legend: {
                    position: 'bottom',
                    title: 'Providers'
                  },
                  trendline: {
                    enabled: true,
                    type: 'linear'
                  }
                },
                {
                  type: 'bar',
                  metric: 'approval_rate',
                  title: 'Monthly Approval Rate by Provider',
                  colors: ['#FF5722', '#2196F3', '#FFEB3B', '#9C27B0', '#4CAF50'], // Bold colors
                  yAxis: {
                    title: 'Approval Rate',
                    format: 'percentage',
                    min: 0,
                    max: 100
                  },
                  xAxis: {
                    title: 'Provider',
                    rotate: -45
                  },
                  dataLabels: {
                    enabled: true,
                    format: '%.1f%%'
                  },
                  animation: {
                    duration: 1000,
                    easing: 'easeInOut'
                  }
                }
              ]
            },
            analysis: {
              focus_areas: [
                'volume_trends',
                'value_patterns',
                'approval_variations'
              ],
              required_insights: [
                'trend_identification',
                'pattern_analysis',
                'provider_comparison',
                'anomaly_detection'
              ],
              thresholds: {
                significant_volume_change: 0.2,
                notable_value_variance: 0.15,
                critical_approval_rate: 0.8
              }
            }
          }
        },
        {
          label: 'Claims Processing Efficiency',
          prompt: 'Analyze claims processing efficiency metrics and bottlenecks based on dataset provided.',
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
          prompt: 'Analyze patterns in value saved through claims processing based on dataset provided',
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