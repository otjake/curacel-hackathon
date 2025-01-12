<template>
  <div class="w-full space-y-2">
    <!-- Prompt Input Area -->
    <div class="relative">
      <textarea
        v-model="prompt"
        placeholder="Enter your prompt here..."
        rows="4"
        class="w-full px-4 py-3 text-gray-700 bg-white border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 focus:outline-none transition-all duration-200 placeholder-gray-400 resize-none"
        :class="{ 'border-blue-500 ring-2 ring-blue-200': prompt.length > 0 }"
      ></textarea>
      
      <!-- Character Count -->
      <div class="absolute bottom-3 right-3">
        <span class="text-sm text-gray-400">
          {{ prompt.length }}/500
        </span>
      </div>
    </div>

    <!-- Suggestions/Tips -->
    <div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
      <div class="flex items-start space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
        </div>
        <div class="flex-1">
          <h4 class="text-sm font-medium text-blue-800 mb-1">Prompt Tips</h4>
          <ul class="text-sm text-blue-600 space-y-1">
            <li>• Be specific about what you want to analyze</li>
            <li>• Include any relevant context or constraints</li>
            <li>• Specify the desired format of the response</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Quick Prompts (Optional) -->
    <div class="flex flex-wrap gap-2 mt-2">
      <button
        v-for="(quickPrompt, index) in quickPrompts"
        :key="index"
        @click="insertQuickPrompt(quickPrompt)"
        class="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 transition-colors duration-200"
      >
        {{ quickPrompt }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  data() {
    return {
      prompt: '',
      quickPrompts: [
        'Analyze trends',
        'Summarize data',
        'Find patterns',
        'Compare values'
      ]
    }
  },
  watch: {
    prompt(newPrompt) {
      // Limit to 500 characters
      if (newPrompt.length > 500) {
        this.prompt = newPrompt.slice(0, 500);
      }
      this.$emit('promptUpdated', this.prompt);
    }
  },
  methods: {
    insertQuickPrompt(quickPrompt) {
      if (this.prompt) {
        this.prompt += ' ' + quickPrompt.toLowerCase();
      } else {
        this.prompt = quickPrompt;
      }
    }
  }
}
</script>

<style scoped>
/* Custom scrollbar for textarea */
textarea::-webkit-scrollbar {
  width: 8px;
}

textarea::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb {
  background: #ddd;
  border-radius: 4px;
}

textarea::-webkit-scrollbar-thumb:hover {
  background: #ccc;
}
</style> 