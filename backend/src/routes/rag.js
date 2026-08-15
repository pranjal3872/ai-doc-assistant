const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require('fs');

let rawRagUrl = (process.env.RAG_SERVICE_URL || 'http://127.0.0.1:8000').trim();
rawRagUrl = rawRagUrl.replace(/^RAG_SERVICE_URL\s*=\s*/i, '').trim();
const RAG_SERVICE_URL = rawRagUrl;

// Helper to get user ID from request session/token or default
const getUserId = (req) => {
  if (req.user && req.user.id) return req.user.id;
  if (req.headers['x-user-id']) return req.headers['x-user-id'];
  return 'default_user';
};

// GET /api/rag/documents - List documents
router.get('/documents', async (req, res) => {
  try {
    const userId = getUserId(req);
    const response = await fetch(`${RAG_SERVICE_URL}/documents`, {
      headers: {
        'X-User-Id': userId,
      },
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
    const userId = getUserId(req);
    const { filename } = req.params;
    const response = await fetch(`${RAG_SERVICE_URL}/documents/${encodeURIComponent(filename)}`, {
      headers: {
        'X-User-Id': userId,
      },
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
    const userId = getUserId(req);
    const { filename } = req.params;
    const response = await fetch(`${RAG_SERVICE_URL}/documents/${encodeURIComponent(filename)}/summary`, {
      headers: {
        'X-User-Id': userId,
      },
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
    const userId = getUserId(req);
    const { filename } = req.params;
    const response = await fetch(`${RAG_SERVICE_URL}/documents/${encodeURIComponent(filename)}`, {
      method: 'DELETE',
      headers: {
        'X-User-Id': userId,
      },
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
    const userId = getUserId(req);
    const fileBuffer = fs.readFileSync(filePath);
    const fileBlob = new Blob([fileBuffer], { type: req.file.mimetype || 'application/pdf' });

    const formData = new globalThis.FormData();
    formData.append('file', fileBlob, req.file.originalname);

    const response = await fetch(`${RAG_SERVICE_URL}/upload`, {
      method: 'POST',
      headers: {
        'X-User-Id': userId,
      },
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
    const userId = getUserId(req);
    const { query, filename } = req.body;

    const response = await fetch(`${RAG_SERVICE_URL}/search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-User-Id': userId,
      },
      body: JSON.stringify({ query, filename, user_id: userId }),
    });

    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error querying RAG service:', error.message);
    res.status(500).json({ error: 'Failed to execute query' });
  }
});

module.exports = router;
