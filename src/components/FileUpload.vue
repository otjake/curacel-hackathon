<template>
  <div class="space-y-4">
    <!-- File Input -->
    <div class="flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
      <div class="space-y-1 text-center">
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="flex text-sm text-gray-600">
          <label class="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
            <span>Upload a file</span>
            <input 
              ref="fileInput"
              type="file" 
              class="sr-only"
              accept=".csv,.xlsx,.xls"
              @change="handleFileUpload"
            >
          </label>
          <p class="pl-1">or drag and drop</p>
        </div>
        <p class="text-xs text-gray-500">CSV, Excel files up to 10MB</p>
      </div>
    </div>

    <!-- File Preview -->
    <div v-if="selectedFile" class="bg-gray-50 p-4 rounded-md">
      <div class="flex items-center justify-between">
        <div class="flex items-center">
          <svg class="h-6 w-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0h8v12H6V4z" clip-rule="evenodd" />
          </svg>
          <span class="ml-2 text-sm text-gray-500">{{ selectedFile.name }}</span>
        </div>
        <button 
          @click="removeFile" 
          class="text-sm text-red-600 hover:text-red-800"
        >
          Remove
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import * as XLSX from 'xlsx';

export default {
  data() {
    return {
      selectedFile: null,
      fileData: null
    }
  },
  methods: {
    handleFileUpload(event) {
      const file = event.target.files[0];
      if (!file) return;

      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        alert('File size exceeds 10MB limit');
        this.removeFile();
        return;
      }

      this.selectedFile = file;
      this.readFile(file);
    },
    
    readFile(file) {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target.result;
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Process the data
          this.processData(jsonData);
        } catch (error) {
          console.error('Error reading file:', error);
          alert('Error reading file. Please make sure it\'s a valid CSV or Excel file.');
          this.removeFile();
        }
      };
      
      reader.readAsArrayBuffer(file);
    },
    
    processData(data) {
      // Remove empty rows
      const cleanData = data.filter(row => row.some(cell => cell !== null && cell !== ''));
      
      if (cleanData.length < 2) {
        alert('File appears to be empty or invalid');
        this.removeFile();
        return;
      }

      // Assume first row is headers
      const headers = cleanData[0];
      const rows = cleanData.slice(1);

      // Helper function to format date consistently
      const formatDate = (date) => {
        try {
          if (!date) return null;
          
          // If it's already in YYYY-MM-DD HH:mm:ss format, return as is
          if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(date)) {
            return date;
          }

          // If it's already in YYYY-MM-DD format, return as is
          if (typeof date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(date)) {
            return date;
          }

          // Handle Excel date number (includes time)
          if (typeof date === 'number' && date > 25569) {
            const jsDate = new Date((date - 25569) * 86400 * 1000);
            if (isNaN(jsDate.getTime())) return null;
            
            // Format with time if it exists
            const hasTime = date % 1 !== 0;
            if (hasTime) {
              return jsDate.toISOString().replace('T', ' ').slice(0, 19);
            }
            return jsDate.toISOString().slice(0, 10);
          }

          // Handle various string date formats
          if (typeof date === 'string') {
            // Handle datetime string with various formats
            if (date.includes(':')) {
              const parsedDate = new Date(date.replace(/[./\\]/g, '-'));
              if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().replace('T', ' ').slice(0, 19);
              }
            }

            // Replace common separators with '-'
            const normalizedDate = date.replace(/[./\\]/g, '-');
            
            // Try parsing the date
            const parsedDate = new Date(normalizedDate);
            if (!isNaN(parsedDate.getTime())) {
              return parsedDate.toISOString().slice(0, 10);
            }

            // Handle DD-MM-YYYY format
            const [day, month, year] = normalizedDate.split('-').map(Number);
            if (day && month && year) {
              const formattedDate = new Date(year, month - 1, day);
              if (!isNaN(formattedDate.getTime())) {
                return formattedDate.toISOString().slice(0, 10);
              }
            }
          }

          return null;
        } catch (error) {
          console.warn('Error formatting date:', date, error);
          return null;
        }
      };

      // Process and validate dates
      const processedRows = rows.map(row => {
        return row.map((cell, index) => {
          const formattedDate = formatDate(cell);
          return formattedDate || cell;
        });
      });

      // Create processed data object with metadata
      const processedData = {
        headers,
        rows: processedRows,
        summary: {
          totalRows: processedRows.length,
          columns: headers.length
        },
        metadata: {
          dateColumns: headers.map((header, index) => {
            // Identify likely date columns
            const hasDateValues = processedRows.some(row => {
              const value = row[index];
              return value && typeof value === 'string' && 
                     (/^\d{4}-\d{2}-\d{2}$/.test(value) || 
                      /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(value));
            });
            return hasDateValues ? header : null;
          }).filter(Boolean),
          dateFormat: 'YYYY-MM-DD [HH:mm:ss]' // Indicate the standardized format supports optional time
        }
      };

      console.log('Processed data:', processedData);
      console.log('Date columns found:', processedData.metadata.dateColumns);

      // Emit the processed data
      this.$emit('fileParsed', processedData);
    },
    
    removeFile() {
      // Reset the file input
      if (this.$refs.fileInput) {
        this.$refs.fileInput.value = '';
      }
      
      // Clear the selected file
      this.selectedFile = null;
      this.fileData = null;
      
      // Emit null to parent to clear any existing data
      this.$emit('fileParsed', null);
    }
  }
}
</script> 