<template>
  <div class="w-full">
    <!-- Upload Area - Hidden when file is uploaded -->
    <div v-if="!uploadedFile" 
         class="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
      <input
        type="file"
        @change="handleFileUpload"
        accept=".csv, .xlsx, .xls"
        class="hidden"
        ref="fileInput"
      />
      <div @click="$refs.fileInput.click()" class="space-y-4">
        <!-- Icon and Text -->
        <div class="flex items-center justify-center space-x-2">
          <svg class="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v9a2 2 0 01-2 2h-1"></path>
          </svg>
          <span class="text-gray-600">Upload a CSV containing list of Claims by <span class="text-blue-600 hover:underline">clicking here</span></span>
        </div>

        <!-- Help Text -->
        <div class="bg-purple-50 p-4 rounded-lg">
          <p class="text-gray-600 text-sm">
            Make sure the CSV file follows the correct format and ensure that all the mandatory columns are filled. 
            <a href="#" class="text-gray-700 underline hover:text-blue-600" @click.prevent="downloadTemplate">
              Click here to download the sample template
            </a>
          </p>
        </div>
      </div>
    </div>

    <!-- File Upload Progress -->
    <div v-if="uploadedFile" 
         class="border border-gray-200 rounded-lg overflow-hidden">
      <div class="flex items-center justify-between p-4 bg-white">
        <div class="flex items-center space-x-4">
          <div class="bg-blue-100 p-2 rounded-full">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div>
            <p class="font-medium text-gray-800">{{ uploadedFile.name }}</p>
            <p class="text-sm text-gray-500">{{ formatFileSize(uploadedFile.size) }}</p>
          </div>
        </div>
        
        <div class="flex items-center space-x-4">
          <!-- Progress Bar -->
          <div class="w-32 sm:w-48">
            <div class="bg-gray-200 rounded-full h-2">
              <div 
                class="bg-blue-600 h-2 rounded-full transition-all duration-500"
                :style="{ width: `${uploadProgress}%` }"
              ></div>
            </div>
          </div>

          <!-- Delete Button -->
          <button 
            @click="removeFile"
            class="text-red-500 hover:text-red-700 transition-colors p-1"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Upload Complete Message -->
      <div v-if="uploadProgress === 100" 
           class="bg-green-50 border-t border-gray-200 px-4 py-2">
        <p class="text-sm text-green-600">File uploaded successfully</p>
      </div>
    </div>
  </div>
</template>

<script>
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export default {
  data() {
    return {
      uploadedFile: null,
      uploadProgress: 0,
      parsedData: null
    }
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      this.uploadedFile = file;
      this.simulateUpload();

      // Check file extension
      const fileExtension = file.name.split('.').pop().toLowerCase();

      if (fileExtension === 'csv') {
        this.parseCSV(file);
      } else if (['xlsx', 'xls'].includes(fileExtension)) {
        this.parseExcel(file);
      }
    },

    parseCSV(file) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          this.handleParsedData(results.data, results.meta.fields);
        },
        error: (error) => {
          console.error('Error parsing CSV:', error);
        }
      });
    },

    parseExcel(file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Get first sheet
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        
        // Convert to JSON
        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        // Separate headers and data
        const headers = jsonData[0];
        const rows = jsonData.slice(1).map(row => {
          const rowData = {};
          headers.forEach((header, index) => {
            rowData[header] = row[index];
          });
          return rowData;
        });

        this.handleParsedData(rows, headers);
      };
      reader.readAsArrayBuffer(file);
    },

    handleParsedData(data, headers) {
      this.parsedData = data;
      console.log('Parsed Data:', data);
      console.log('Headers:', headers);
      console.log('Rows:', data.length);

      this.$emit('fileParsed', {
        data: data,
        headers: headers,
        rowCount: data.length
      });
    },

    simulateUpload() {
      this.uploadProgress = 0;
      const interval = setInterval(() => {
        if (this.uploadProgress < 100) {
          this.uploadProgress += 10;
        } else {
          clearInterval(interval);
        }
      }, 100);
    },

    removeFile() {
      this.uploadedFile = null;
      this.uploadProgress = 0;
      this.parsedData = null;
      this.$refs.fileInput.value = '';
      this.$emit('fileParsed', null);
    },

    formatFileSize(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    downloadTemplate() {
      // Implement template download logic here
      console.log('Downloading template...');
    }
  }
};
</script> 