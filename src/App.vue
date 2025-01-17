<template>
  <div class="min-h-screen bg-white">
    <!-- Navbar -->
    <nav class="bg-white shadow-md">
      <div class="px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <!-- Logo -->
            <img src="https://cdn.prod.website-files.com/636cd89449397edf946d99a9/636d307bd471f94b8d85fd30_Curacel-Logo%20(1).svg" alt="Logo" class="w-10 h-10 rounded-full"/>
            <span class="ml-2 text-xl font-semibold text-gray-800">ANALYZER1.0</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container px-4 py-8 mx-auto sm:px-6 lg:px-8">
      <div class="mx-auto max-w-3xl">
        <div class="p-6 bg-white rounded-xl border border-gray-200 shadow-sm sm:p-8 lg:p-10">
          <h1 class="mb-6 text-2xl font-bold text-center text-gray-900 sm:text-3xl lg:text-4xl sm:mb-8">
             Data Analyzer 1.0
          </h1>

          <!-- File Upload Section -->
          <div class="mb-6">
            <label class="block mb-2 text-sm font-medium text-gray-700 sm:text-base">Upload File</label>
            <FileUpload @fileParsed="handleFileParsed" />
          </div>

          <!-- Prompt Input Section -->
          <div class="mb-6">
            <label class="block mb-2 text-sm font-medium text-gray-700 sm:text-base">Your Prompt</label>
            <PromptInput 
              @promptUpdated="handlePromptUpdated" 
              @clearResults="clearResults"
            />
          </div>

          <!-- Response Type Selection -->
          <div class="mb-6">
            <label class="block mb-2 text-sm font-medium text-gray-700 sm:text-base">Response Format</label>
            <div class="flex space-x-6">
              <label class="inline-flex items-center">
                <input type="radio" 
                       value="text" 
                       v-model="responseType"
                       class="w-5 h-5 text-blue-600 form-radio" />
                <span class="ml-2 text-sm text-gray-700 sm:text-base">Text</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" 
                       value="file" 
                       v-model="responseType"
                       class="w-5 h-5 text-blue-600 form-radio" />
                <span class="ml-2 text-sm text-gray-700 sm:text-base">File</span>
              </label>
            </div>
          </div>

          <!-- Add this after Response Format selection and before Submit Button -->
          <div class="mb-6">
            <label class="block mb-2 text-sm font-medium text-gray-700 sm:text-base">Chart Type</label>
            <select 
              v-model="selectedChartType"
              class="block px-3 py-2 w-full text-sm rounded-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 sm:text-base">
              <option value="bar">Bar Chart</option>
              <option value="line">Line Chart</option>
              <option value="pie">Pie Chart</option>
              <option value="doughnut">Doughnut Chart</option>
              <option value="radar">Radar Chart</option>
            </select>
          </div>

          <!-- Submit Button -->
          <button 
            @click="getResponse"
            class="w-full sm:w-auto sm:min-w-[200px] sm:mx-auto block bg-blue-600 text-white 
                   py-3 px-6 rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out 
                   font-medium text-sm sm:text-base focus:outline-none focus:ring-2 
                   focus:ring-offset-2 focus:ring-blue-500">
            Get Response
          </button>

          <!-- Add this in the template near the Submit Button -->
          <div v-if="isLoading" class="mt-4 text-center">
            <div class="inline-block w-8 h-8 rounded-full border-4 border-blue-600 animate-spin border-t-transparent"></div>
            <p class="mt-2 text-gray-600">Processing your request...</p>
          </div>

          <!-- Response Section -->
          <div v-if="response" class="mt-8">
            <div v-if="responseType === 'text'" 
                 class="p-4 bg-gray-50 rounded-lg border border-gray-200 sm:p-6">
              <p class="text-sm text-gray-700 whitespace-pre-wrap sm:text-base">{{ response }}</p>
            </div>
            <a v-else 
               :href="fileUrl" 
               download="response.txt"
               class="inline-flex items-center text-sm text-blue-600 hover:text-blue-700 sm:text-base">
              <svg class="mr-2 w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4.17l-1.59-1.58a1 1 0 00-1.42 1.41l3 3a1 1 0 001.42 0l3-3a1 1 0 00-1.41-1.41L11 11.17V7z"></path>
              </svg>
              Download Response
            </a>
          </div>

          <!-- Add this inside the Response Section, after the existing response display -->
          <div v-if="response && responseType === 'file'" class="mt-4">
            <p class="text-sm text-gray-600">Raw URL:</p>
            <code class="block p-2 mt-1 text-sm break-all bg-gray-100 rounded">{{ fileUrl }}</code>
          </div>

          <!-- Add this in the Response Section -->
          <div v-if="parsedResponse" class="mt-8 space-y-6">
            <!-- Summary Section -->
            <div class="p-4 bg-white rounded-lg border border-gray-200">
              <h2 class="mb-4 text-xl font-semibold text-gray-800">Analysis Summary</h2>
              <p class="text-gray-600">{{ parsedResponse.summary }}</p>
            </div>

            <!-- Charts Section -->
            <div v-for="(viz, index) in parsedResponse.visualizations" :key="index" 
                 class="p-4 bg-white rounded-lg border border-gray-200">
              <h3 class="mb-2 text-lg font-medium text-gray-800">{{ viz.title }}</h3>
              <p v-if="viz.description" class="mb-4 text-gray-600">{{ viz.description }}</p>
              <DataChart 
                :chartData="viz.data"
                :chartType="selectedChartType"
                :structure="analysisStructure"
              />
            </div>

            <!-- Insights Section -->
            <div v-if="parsedResponse?.insights" class="p-4 bg-white rounded-lg border border-gray-200">
              <h2 class="mb-4 text-xl font-semibold text-gray-800">Key Insights</h2>
              <div v-for="(insight, index) in parsedResponse.insights" :key="index" class="mb-4">
                <h3 class="font-medium text-gray-800">{{ insight.category }}</h3>
                <p class="text-gray-600">{{ insight.finding }}</p>
                <p class="mt-1 text-sm text-gray-500">Impact: {{ insight.impact }}</p>
              </div>
            </div>

            <!-- Add this to the template where metrics are displayed -->
            <div v-if="parsedResponse?.metrics" class="grid grid-cols-1 gap-6 mb-8 md:grid-cols-3">
              <!-- Value of Submitted Claims -->
              <div class="p-6 text-white bg-gray-700 rounded-lg">
                <h3 class="mb-2 text-lg font-normal">Value of Submitted claims</h3>
                <div class="mb-2 text-3xl font-bold">
                  KES {{ formatNumber(parsedResponse.metrics.submitted_claims) }} Million
                </div>
                <div class="text-sm text-green-400">
                  +{{ parsedResponse.metrics.month_over_month }}% from last month
                </div>
              </div>

              <!-- Value of Savings -->
              <div class="p-6 text-white bg-blue-600 rounded-lg">
                <h3 class="mb-2 text-lg font-normal">Value of Savings</h3>
                <div class="text-3xl font-bold">
                  KES {{ formatNumber(parsedResponse.metrics.savings) }}
                </div>
              </div>

              <!-- Percentage Saved -->
              <div class="p-6 bg-[#1B365C] rounded-lg text-white">
                <h3 class="mb-2 text-lg font-normal">Percentage Saved</h3>
                <div class="text-3xl font-bold">
                  {{ parsedResponse.metrics.savings_percentage }}%
                </div>
              </div>
            </div>
          </div>

          <!-- Add this after the Submit Button -->
          <div v-if="isLoading" class="flex fixed inset-0 z-50 justify-center items-center bg-black bg-opacity-50">
            <div class="p-8 mx-4 w-full max-w-md bg-white rounded-lg shadow-xl">
              <div class="flex flex-col items-center space-y-4">
                <!-- Animated Loading Icon -->
                <div class="relative w-20 h-20">
                  <div class="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-200"></div>
                  <div class="absolute top-0 left-0 w-full h-full rounded-full border-4 border-blue-600 animate-spin border-t-transparent"></div>
                </div>
                
                <!-- Loading Text -->
                <div class="text-center">
                  <h3 class="text-lg font-semibold text-gray-900">Analyzing Data</h3>
                  <p class="mt-1 text-sm text-gray-500">{{ loadingMessage }}</p>
                </div>

                <!-- Progress Steps -->
                <div class="space-y-2 w-full">
                  <div v-for="(step, index) in loadingSteps" :key="index"
                       class="flex items-center space-x-2">
                    <div :class="`w-4 h-4 rounded-full ${step.completed ? 'bg-green-500' : 'bg-gray-200'}`"></div>
                    <span :class="`text-sm ${step.completed ? 'text-gray-900' : 'text-gray-500'}`">
                      {{ step.label }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
import FileUpload from './components/FileUpload.vue';
import PromptInput from './components/PromptInput.vue';
import DataChart from './components/DataChart.vue';
import DataService from '@/services/DataService';

export default {
  components: { 
    FileUpload, 
    PromptInput,
    DataChart
  },
  data() {
    return {
      fileData: null,
      prompt: '',
      responseType: 'text',
      response: null,
      fileUrl: null,
      isLoading: false,
      chartData: null,
      selectedChartType: 'bar',
      parsedResponse: null,
      analysisStructure: null,
      loadingSteps: [
        { label: 'Processing data', completed: false },
        { label: 'Analyzing patterns', completed: false },
        { label: 'Generating visualizations', completed: false },
        { label: 'Preparing insights', completed: false }
      ],
      loadingMessage: 'Please wait while we analyze your data...'
    };
  },
  methods: {
    handleFileParsed(data) {
      this.fileData = data;
      // Clear previous results when data source changes
      this.response = null;
      this.parsedResponse = null;
      this.chartData = null;
    },
    clearResults() {
      // Clear all response-related data
      this.response = null;
      this.fileUrl = null;
      this.parsedResponse = null;
      this.chartData = null;
      
      // Reset visualization states
      this.selectedChartType = 'bar';
      
      // Clear any error states
      this.isLoading = false;
      
      // Force a re-render of the chart component
      this.$nextTick(() => {
        console.log('Cleared previous results');
      });
    },
    handlePromptUpdated(prompt, structure) {
      // Clear previous results first
      this.clearResults();
      
      // Then set new values
      this.$nextTick(() => {
      this.prompt = prompt;
      this.analysisStructure = structure;
      });
    },
    async getResponse() {
      if (!this.fileData || !this.prompt) {
        alert('Please upload a file and enter a prompt');
        return;
      }

      this.isLoading = true;
      this.resetLoadingSteps();
      
      try {
        // Start the loading animation
        this.startLoadingAnimation();

        // Complete first step immediately
        this.completeLoadingStep(0);
        
        const response = await axios.post('https://api.openai.com/v1/chat/completions', {
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are an expert data analyst specializing in medical data analysis. 
              Important date handling instructions:
              - Use only actual dates present in the data
              - Do not generate or hallucinate dates
              - For time series analysis, use the date column: ${this.fileData?.metadata?.dateColumns?.[0] || 'None found'}
              - Group data by actual available time periods
              Focus on key trends, patterns, and actionable insights using only the provided data.`
            },
            {
              role: "user",
              content: `Here is the dataset for analysis:
              Headers: ${JSON.stringify(this.fileData?.headers)}
              Date columns: ${JSON.stringify(this.fileData?.metadata?.dateColumns)}
              Data: ${JSON.stringify(this.fileData?.rows)}
              What I want to do is: ${this.prompt}`
            }
          ],
          functions: [
            {
              name: "analyze_claims_data",
              description: "Generate structured analysis of claims and provider data",
              parameters: {
                type: "object",
                properties: {
                  summary: {
                    type: "string",
                    description: "Brief summary of key findings"
                  },
                  visualizations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        type: { type: "string" },
                        data: {
                          type: "object",
                          properties: {
                            labels: {
                              type: "array",
                              items: { type: "string" },
                              description: "Use only actual dates/periods from the data"
                            },
                            datasets: {
                              type: "array",
                              items: {
                                type: "object",
                                properties: {
                                  label: { type: "string" },
                                  data: { 
                                    type: "array",
                                    items: { type: "number" }
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          ],
          function_call: { name: "analyze_claims_data" }
        }, {
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`,
            'Content-Type': 'application/json',
          },
        });

        // Complete remaining steps
        this.completeLoadingStep(1);
        await this.delay(800); // Add small delay for visual feedback
        
        const functionCall = response.data.choices[0].message.function_call;
        this.parsedResponse = JSON.parse(functionCall.arguments);
        
        this.completeLoadingStep(2);
        await this.delay(500);
        
        // Format response and complete final step
        this.formatResponse();
        this.completeLoadingStep(3);
        
      } catch (error) {
        console.error('Error getting response:', error);
        this.loadingMessage = 'An error occurred while processing your request';
        await this.delay(1000);
        alert('Failed to get response from GPT');
      } finally {
        await this.delay(500); // Small delay before closing
        this.isLoading = false;
        this.resetLoadingSteps();
      }
    },
    resetLoadingSteps() {
      this.loadingSteps.forEach(step => step.completed = false);
      this.loadingMessage = 'Please wait while we analyze your data...';
    },
    completeLoadingStep(index) {
      if (index < this.loadingSteps.length) {
        this.loadingSteps[index].completed = true;
        this.loadingMessage = this.loadingSteps[index].label;
      }
    },
    startLoadingAnimation() {
      let messageIndex = 0;
      const messages = [
        'Analyzing patterns in your data...',
        'Identifying key trends...',
        'Generating comprehensive insights...',
        'Almost there...'
      ];

      this.loadingInterval = setInterval(() => {
        messageIndex = (messageIndex + 1) % messages.length;
        this.loadingMessage = messages[messageIndex];
      }, 2000);
    },
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    formatNumber(value) {
      if (!value) return '0';
      return new Intl.NumberFormat('en-KE', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0
      }).format(value);
    },
    formatResponse() {
      // Format the analysis report
      this.response = `
Analysis Report

Summary:
${this.parsedResponse.summary}

Metrics Overview:
${Object.entries(this.parsedResponse.metrics || {}).map(([key, value]) => 
  `\n${key}: ${JSON.stringify(value)}`
).join('\n')}

Visualizations:
${this.parsedResponse.visualizations.map(viz => 
  `\n${viz.title}\n${viz.description || ''}`
).join('\n\n')}
`.trim();

      // Create downloadable file if needed
        if (this.responseType === 'file') {
          const blob = new Blob([this.response], { type: 'text/plain' });
          this.fileUrl = URL.createObjectURL(blob);
        }

      // Clear the loading interval
      if (this.loadingInterval) {
        clearInterval(this.loadingInterval);
        this.loadingInterval = null;
      }
    }
  },
  beforeDestroy() {
    if (this.loadingInterval) {
      clearInterval(this.loadingInterval);
      this.loadingInterval = null;
    }
  }
}
</script>

<style scoped>
/* Add your styles here */
</style>