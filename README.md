# PDF to JSON Converter

A web application that converts PDF files to JSON format and analyzes their content to generate appropriate SQL table structures.

## Features

- PDF to JSON conversion
- Document type detection (invoice, receipt, report, contract, form)
- Automatic SQL table structure generation
- Confidence scoring for document type detection
- Modern UI with drag-and-drop file upload
- Real-time analysis and preview

## Tech Stack

- **Frontend**: React.js with Chakra UI
- **Backend**: Node.js/Express.js
- **PDF Processing**: pdf-parse
- **File Upload**: react-dropzone

## Installation

1. Clone the repository:
```bash
git clone <your-repository-url>
cd pdf-json-converter
```

2. Install server dependencies:
```bash
cd server
npm install
```

3. Install client dependencies:
```bash
cd ../client
npm install
```

## Running the Application

1. Start the server:
```bash
cd server
npm start
```

2. Start the client:
```bash
cd client
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Usage

1. Open the application in your browser
2. Drag and drop a PDF file or click to select one
3. Wait for the analysis to complete
4. View the results:
   - Document type and confidence score
   - SQL table structure
   - Extracted text and metadata
5. Download the JSON file if needed

## Project Structure

```
pdf-json-converter/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # React components
│   │   └── App.js        # Main application component
│   └── package.json
├── server/                # Express backend
│   ├── index.js          # Server entry point
│   └── package.json
└── README.md
```

## License

MIT 