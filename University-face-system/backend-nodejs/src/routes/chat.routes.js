const express = require('express');
const router = express.Router();
const { sendMessage, sendMessageStream } = require('../controllers/chat.controller');
const authMiddleware = require('../middleware/auth.middleware');

// POST /api/chat           - regular response
router.post('/', authMiddleware, sendMessage);

// POST /api/chat/stream    - Server-Sent Events streaming
router.post('/stream', authMiddleware, sendMessageStream);

module.exports = router;
