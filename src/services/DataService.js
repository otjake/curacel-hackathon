import sampleData from '@/assets/first_500_lines.json'

export default class DataService {
  static getSampleData() {
    return sampleData;
  }

  static formatSampleData() {
    return {
      headers: Object.keys(sampleData[0]),
      rows: sampleData.map(row => Object.values(row)),
      summary: {
        totalRows: sampleData.length,
        columns: Object.keys(sampleData[0]).length
      },
      metadata: {
        dateColumns: ['Encounter Date', 'Submitted Date', 'Time of Payment']
      }
    };
  }
} 