const express = require('express');
const cors = require('cors');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const path = require('path');
require('dotenv').config();

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Middleware
app.use(cors());
app.use(express.json());

// Function to detect document type based on keywords
function detectDocumentType(text) {
  const keywords = {
    exam_schedule: ['exam', 'schedule', 'final', 'exams', 'course', 'code', 'time', 'date'],
    invoice: ['invoice', 'bill', 'payment', 'amount', 'total', 'due', 'date'],
    receipt: ['receipt', 'paid', 'payment', 'amount', 'total', 'date'],
    report: ['report', 'summary', 'analysis', 'findings', 'conclusion'],
    contract: ['contract', 'agreement', 'terms', 'conditions', 'parties'],
    form: ['form', 'application', 'submit', 'sign', 'date']
  };

  const scores = {};
  for (const [type, words] of Object.entries(keywords)) {
    scores[type] = words.filter(word => 
      text.toLowerCase().includes(word.toLowerCase())
    ).length;
  }

  const maxScore = Math.max(...Object.values(scores));
  const detectedType = Object.keys(scores).find(type => scores[type] === maxScore);
  
  return {
    type: detectedType || 'other',
    confidence: maxScore / Math.max(...Object.values(keywords).map(arr => arr.length))
  };
}

// Function to parse exam schedule data
function parseExamSchedule(text) {
  const lines = text.split('\n').filter(line => line.trim());
  const exams = [];
  
  // Skip header lines
  for (let i = 2; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line && !line.includes('Final Exams Schedule')) {
      const parts = line.split(/\s+/);
      if (parts.length >= 4) {
        const code = parts[0];
        const title = parts.slice(1, -2).join(' ').replace(/^[A-Z0-9]+\s*-\s*/, '');
        const date = parts[parts.length - 2];
        const time = parts[parts.length - 1];
        
        exams.push({
          code,
          title,
          date,
          time
        });
      }
    }
  }
  
  return exams;
}

// Function to generate SQL structure based on text content
function generateSQLStructure(text, docType) {
  if (docType === 'exam_schedule') {
    return {
      tableName: 'exam_schedules',
      columns: [
        { name: 'exam_id', type: 'VARCHAR(50)', constraints: ['PRIMARY KEY'] },
        { name: 'course_code', type: 'VARCHAR(20)', constraints: ['NOT NULL'] },
        { name: 'course_title', type: 'VARCHAR(200)', constraints: ['NOT NULL'] },
        { name: 'exam_date', type: 'DATE', constraints: ['NOT NULL'] },
        { name: 'exam_time', type: 'VARCHAR(20)', constraints: ['NOT NULL'] },
        { name: 'semester', type: 'VARCHAR(50)', constraints: ['NOT NULL'] },
        { name: 'academic_year', type: 'VARCHAR(20)', constraints: ['NOT NULL'] }
      ],
      sampleInsert: `INSERT INTO exam_schedules (exam_id, course_code, course_title, exam_date, exam_time, semester, academic_year)
VALUES ('EXAM001', 'CS101', 'Introduction to Programming', '2025-05-06', '13.30-15.30', 'Spring', '2025');`
    };
  }

  // Common patterns for different document types
  const patterns = {
    invoice: {
      tableName: 'invoices',
      columns: [
        { name: 'invoice_id', type: 'VARCHAR(50)', constraints: ['PRIMARY KEY'] },
        { name: 'invoice_date', type: 'DATE', constraints: ['NOT NULL'] },
        { name: 'customer_name', type: 'VARCHAR(100)', constraints: ['NOT NULL'] },
        { name: 'total_amount', type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] },
        { name: 'payment_status', type: 'VARCHAR(20)', constraints: ['NOT NULL'] },
        { name: 'due_date', type: 'DATE', constraints: [] }
      ]
    },
    receipt: {
      tableName: 'receipts',
      columns: [
        { name: 'receipt_id', type: 'VARCHAR(50)', constraints: ['PRIMARY KEY'] },
        { name: 'receipt_date', type: 'DATE', constraints: ['NOT NULL'] },
        { name: 'vendor_name', type: 'VARCHAR(100)', constraints: ['NOT NULL'] },
        { name: 'amount', type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] },
        { name: 'payment_method', type: 'VARCHAR(50)', constraints: [] }
      ]
    },
    report: {
      tableName: 'reports',
      columns: [
        { name: 'report_id', type: 'VARCHAR(50)', constraints: ['PRIMARY KEY'] },
        { name: 'report_date', type: 'DATE', constraints: ['NOT NULL'] },
        { name: 'title', type: 'VARCHAR(200)', constraints: ['NOT NULL'] },
        { name: 'content', type: 'TEXT', constraints: [] },
        { name: 'author', type: 'VARCHAR(100)', constraints: [] }
      ]
    },
    contract: {
      tableName: 'contracts',
      columns: [
        { name: 'contract_id', type: 'VARCHAR(50)', constraints: ['PRIMARY KEY'] },
        { name: 'start_date', type: 'DATE', constraints: ['NOT NULL'] },
        { name: 'end_date', type: 'DATE', constraints: [] },
        { name: 'parties', type: 'VARCHAR(200)', constraints: ['NOT NULL'] },
        { name: 'terms', type: 'TEXT', constraints: [] }
      ]
    },
    form: {
      tableName: 'forms',
      columns: [
        { name: 'form_id', type: 'VARCHAR(50)', constraints: ['PRIMARY KEY'] },
        { name: 'submission_date', type: 'DATE', constraints: ['NOT NULL'] },
        { name: 'applicant_name', type: 'VARCHAR(100)', constraints: ['NOT NULL'] },
        { name: 'status', type: 'VARCHAR(20)', constraints: ['NOT NULL'] },
        { name: 'data', type: 'JSON', constraints: [] }
      ]
    },
    other: {
      tableName: 'documents',
      columns: [
        { name: 'document_id', type: 'VARCHAR(50)', constraints: ['PRIMARY KEY'] },
        { name: 'document_date', type: 'DATE', constraints: ['NOT NULL'] },
        { name: 'title', type: 'VARCHAR(200)', constraints: ['NOT NULL'] },
        { name: 'content', type: 'TEXT', constraints: [] },
        { name: 'metadata', type: 'JSON', constraints: [] }
      ]
    }
  };

  const structure = patterns[docType] || patterns.other;
  
  // Generate sample INSERT statement
  const sampleInsert = `INSERT INTO ${structure.tableName} (${structure.columns.map(c => c.name).join(', ')})
VALUES (${structure.columns.map(c => {
  switch(c.type) {
    case 'VARCHAR': return "'sample_value'";
    case 'DATE': return "'2024-01-01'";
    case 'DECIMAL': return "0.00";
    case 'TEXT': return "'sample text'";
    case 'JSON': return "'{}'";
    default: return "NULL";
  }
}).join(', ')});`;

  return {
    ...structure,
    sampleInsert
  };
}

// PDF to JSON conversion endpoint
app.post('/api/convert', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file uploaded' });
    }

    const data = await pdfParse(req.file.buffer);
    
    // Basic text extraction
    const jsonData = {
      text: data.text,
      numPages: data.numpages,
      info: data.info,
      metadata: data.metadata,
      version: data.version
    };

    // Detect document type and generate SQL structure
    const { type, confidence } = detectDocumentType(data.text);
    const sqlStructure = generateSQLStructure(data.text, type);

    // Parse exam schedule if applicable
    const examData = type === 'exam_schedule' ? parseExamSchedule(data.text) : null;

    // Combine the results
    const response = {
      ...jsonData,
      analysis: {
        documentType: type,
        confidence,
        sqlStructure,
        examData
      }
    };

    res.json(response);
  } catch (error) {
    console.error('Error processing PDF:', error);
    res.status(500).json({ message: 'Error processing PDF file' });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 