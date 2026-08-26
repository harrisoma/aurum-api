"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const echo_js_1 = require("../services/echo.js");
const router = (0, express_1.Router)();
router.get('/legacy', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const items = await (0, echo_js_1.getLegacyItems)(req.user.id);
        res.json({ items, count: items.length, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch legacy items' });
    }
});
router.post('/legacy', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { title, description, category } = req.body;
        const item = await (0, echo_js_1.createLegacyItem)(req.user.id, title, description, category);
        res.status(201).json({ item, message: 'Legacy item documented' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create legacy item' });
    }
});
router.get('/memories', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const memories = await (0, echo_js_1.getMemories)(req.user.id);
        res.json({ memories, count: memories.length, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch memories' });
    }
});
router.post('/memories', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { title, content, memoryDate } = req.body;
        const memory = await (0, echo_js_1.recordMemory)(req.user.id, title, content, memoryDate);
        res.status(201).json({ memory, message: 'Memory recorded' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to record memory' });
    }
});
router.get('/insights', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const insights = await (0, echo_js_1.getLegacyInsights)(req.user.id);
        res.json({ insights, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to generate insights' });
    }
});
router.get('/dashboard', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const items = await (0, echo_js_1.getLegacyItems)(req.user.id);
        const memories = await (0, echo_js_1.getMemories)(req.user.id);
        res.json({
            summary: { legacyItems: items.length, memories: memories.length },
            recentItems: items.slice(0, 5),
            recentMemories: memories.slice(0, 5),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});
exports.default = router;
//# sourceMappingURL=echo.js.map