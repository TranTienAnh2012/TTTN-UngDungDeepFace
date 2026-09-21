const chatService = require('../services/chat.service');

/**
 * POST /api/chat/stream  (Server-Sent Events)
 * Body: { messages: [{role, content}] }
 * Auth: Bearer token required
 * Client reads EventSource-like text/event-stream
 */
async function sendMessageStream(req, res) {
    const { messages } = req.body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ success: false, message: 'Danh sach tin nhan khong hop le' });
    }
    for (const msg of messages) {
        if (!msg.role || !msg.content || typeof msg.content !== 'string') {
            return res.status(400).json({ success: false, message: 'Dinh dang tin nhan khong hop le' });
        }
        if (msg.content.length > 1000) {
            return res.status(400).json({ success: false, message: 'Tin nhan qua dai (toi da 1000 ky tu)' });
        }
    }

    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if any
    res.flushHeaders();

    try {
        await chatService.chatStream(messages, (chunk) => {
            // Send each chunk as SSE data event
            res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
        });
        // Signal completion
        res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    } catch (err) {
        console.error('[ChatController Stream] Error:', err.message);
        res.write(`data: ${JSON.stringify({ error: err.message || 'Loi he thong' })}\n\n`);
    } finally {
        res.end();
    }
}

/**
 * POST /api/chat  (regular, non-streaming — kept for compatibility)
 */
async function sendMessage(req, res) {
    try {
        const { messages } = req.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return res.status(400).json({ success: false, message: 'Danh sach tin nhan khong hop le' });
        }
        const reply = await chatService.chat(messages);
        return res.json({ success: true, data: { reply } });
    } catch (err) {
        console.error('[ChatController] Error:', err.message);
        return res.status(500).json({ success: false, message: err.message || 'Loi he thong' });
    }
}

module.exports = { sendMessage, sendMessageStream };
