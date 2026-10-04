const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');
const { authenticateToken } = require('../middleware/auth');

let rawRagUrl = (process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8000').trim();
rawRagUrl = rawRagUrl.replace(/^RAG_SERVICE_URL\s*=\s*/i, '').trim();
const RAG_SERVICE_URL = rawRagUrl;

// Shared secret proving to the RAG service that a request came from this backend
const RAG_INTERNAL_KEY = (process.env.RAG_INTERNAL_KEY || '').trim();
if (!RAG_INTERNAL_KEY) {
  console.warn('RAG_INTERNAL_KEY is not set; the RAG service will trust any caller.');
}

// Every RAG route requires a signed-in user; documents are scoped to their ID
router.use(authenticateToken);

const getUserId = (req) => req.user.id;

// Headers sent to the RAG service: the authenticated user ID plus the internal key
const ragHeaders = (req, extra = {}) => {
  const headers = { ...extra, 'X-User-Id': getUserId(req) };
  if (RAG_INTERNAL_KEY) headers['X-Internal-Key'] = RAG_INTERNAL_KEY;
  return headers;
};

// GET /api/rag/documents - List documents
router.get('/documents', async (req, res) => {
  try {
    const response = await fetch(`${RAG_SERVICE_URL}/documents`, {
      headers: ragHeaders(req),
    });
    if (!response.ok) {
      throw new Error(`RAG service returned ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching documents from RAG service:', error.message);
    res.status(500).json({
      error: `Failed to fetch documents from RAG service (${RAG_SERVICE_URL})`,
      targetUrl: RAG_SERVICE_URL,
      details: error.message,
      documents: []
    });
  }
});

// GET /api/rag/documents/:filename - Get document content
router.get('/documents/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const response = await fetch(`${RAG_SERVICE_URL}/documents/${encodeURIComponent(filename)}`, {
      headers: ragHeaders(req),
    });
    if (!response.ok) {
      throw new Error(`RAG service returned ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching document detail from RAG service:', error.message);
    res.status(500).json({ error: 'Failed to fetch document detail' });
  }
});

// GET /api/rag/documents/:filename/summary - Get document summary & suggested prompts
router.get('/documents/:filename/summary', async (req, res) => {
  try {
    const { filename } = req.params;
    const response = await fetch(`${RAG_SERVICE_URL}/documents/${encodeURIComponent(filename)}/summary`, {
      headers: ragHeaders(req),
    });
    if (!response.ok) {
      throw new Error(`RAG service returned ${response.status}`);
    }
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error fetching document summary from RAG service:', error.message);
    res.status(500).json({ error: 'Failed to fetch document summary' });
  }
});

// DELETE /api/rag/documents/:filename - Delete document
router.delete('/documents/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const response = await fetch(`${RAG_SERVICE_URL}/documents/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: ragHeaders(req),
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error deleting document:', error.message);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// POST /api/rag/upload - Upload PDF
router.post('/upload', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const filePath = req.file.path;
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype || 'application/pdf' });

    const formData = new globalThis.FormData();
    formData.append('file', fileBlob, req.file.originalname);

    const response = await fetch(`${RAG_SERVICE_URL}/upload`, {
      method: 'POST',
      headers: ragHeaders(req),
      body: formData,
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error uploading file to RAG service:', error.message);
    res.status(500).json({ error: 'Failed to process document upload' });
  } finally {
    // Clean up temporary upload file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
});

// POST /api/rag/search - Query RAG service
router.post('/search', async (req, res) => {
  try {
    const { query, filename } = req.body;

    const response = await fetch(`${RAG_SERVICE_URL}/search`, {
      method: 'POST',
      headers: ragHeaders(req, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ query, filename }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error querying RAG service:', error.message);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});

// POST /api/rag/compare - Compare 2 documents side-by-side
router.post('/compare', async (req, res) => {
  try {
    const { doc_a, doc_b } = req.body;

    const response = await fetch(`${RAG_SERVICE_URL}/compare`, {
      method: 'POST',
      headers: ragHeaders(req, { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ doc_a, doc_b }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error comparing documents:', error.message);
    res.status(500).json({ error: 'Failed to compare documents' });
  }
});

module.exports = router;


