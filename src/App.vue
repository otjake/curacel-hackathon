<template>
  <div class="min-h-screen bg-white">
    <!-- Navbar -->
    <nav class="bg-white shadow-md">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex items-center">
            <!-- Logo -->
            <img src="https://placehold.co/40x40" alt="Logo" class="h-10 w-10 rounded-full"/>
            <span class="ml-2 text-xl font-semibold text-gray-800">CSV GPT</span>
          </div>
        </div>
      </div>
    </nav>

    <!-- Main Content -->
    <div class="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div class="max-w-3xl mx-auto">
        <div class="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8 lg:p-10">
          <h1 class="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
            CSV/Excel to GPT Chat Response
          </h1>

          <!-- File Upload Section -->
          <div class="mb-6">
            <label class="block text-sm sm:text-base font-medium text-gray-700 mb-2">Upload File</label>
            <FileUpload @fileParsed="handleFileParsed" />
          </div>

          <!-- Prompt Input Section -->
          <div class="mb-6">
            <label class="block text-sm sm:text-base font-medium text-gray-700 mb-2">Your Prompt</label>
            <PromptInput @promptUpdated="handlePromptUpdated" />
          </div>

          <!-- Response Type Selection -->
          <div class="mb-6">
            <label class="block text-sm sm:text-base font-medium text-gray-700 mb-2">Response Format</label>
            <div class="flex space-x-6">
              <label class="inline-flex items-center">
                <input type="radio" 
                       value="text" 
                       v-model="responseType"
                       class="form-radio h-5 w-5 text-blue-600" />
                <span class="ml-2 text-gray-700 text-sm sm:text-base">Text</span>
              </label>
              <label class="inline-flex items-center">
                <input type="radio" 
                       value="file" 
                       v-model="responseType"
                       class="form-radio h-5 w-5 text-blue-600" />
                <span class="ml-2 text-gray-700 text-sm sm:text-base">File</span>
              </label>
            </div>
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

          <!-- Response Section -->
          <div v-if="response" class="mt-8">
            <div v-if="responseType === 'text'" 
                 class="bg-gray-50 rounded-lg p-4 sm:p-6 border border-gray-200">
              <p class="text-gray-700 whitespace-pre-wrap text-sm sm:text-base">{{ response }}</p>
            </div>
            <a v-else 
               :href="fileUrl" 
               download="response.txt"
               class="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm sm:text-base">
              <svg class="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v4.17l-1.59-1.58a1 1 0 00-1.42 1.41l3 3a1 1 0 001.42 0l3-3a1 1 0 00-1.41-1.41L11 11.17V7z"></path>
              </svg>
              Download Response
            </a>
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

export default {
  components: { FileUpload, PromptInput },
  data() {
    return {
      fileData: null,
      prompt: '',
      responseType: 'text',
      response: null,
      fileUrl: null,
    };
  },
  methods: {
    handleFileParsed(data) {
      this.fileData = data;
      console.log(this.fileData);
    },
    handlePromptUpdated(prompt) {
      this.prompt = prompt;
    },
    async getResponse() {
      try {
        const response = await axios.post('https://api.openai.com/v1/engines/davinci-codex/completions', {
          prompt: this.prompt,
          max_tokens: 150,
        }, {
          headers: {
            'Authorization': `Bearer YOUR_API_KEY`,
          },
        });
        this.response = response.data.choices[0].text;
        if (this.responseType === 'file') {
          const blob = new Blob([this.response], { type: 'text/plain' });
          this.fileUrl = URL.createObjectURL(blob);
        }
      } catch (error) {
        console.error('Error fetching response:', error);
      }
    },
  },
};
</script>

<style>
/* Add any additional custom styles here if needed */
</style>
