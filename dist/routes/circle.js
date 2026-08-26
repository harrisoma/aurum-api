"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_js_1 = require("../middleware/auth.js");
const circle_js_1 = require("../services/circle.js");
const router = (0, express_1.Router)();
router.get('/connections', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const connections = await (0, circle_js_1.getConnections)(req.user.id);
        res.json({ connections, count: connections.length, timestamp: new Date().toISOString() });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to fetch connections' });
    }
});
router.post('/connections', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { name, relationship } = req.body;
        const connection = await (0, circle_js_1.createConnection)(req.user.id, name, relationship);
        res.status(201).json({ connection, message: `Added ${name} to your circle` });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to create connection' });
    }
});
router.post('/interactions', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { connectionId, note } = req.body;
        const interaction = await (0, circle_js_1.recordInteraction)(req.user.id, connectionId, note);
        res.status(201).json({ interaction, message: 'Interaction recorded' });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to record interaction' });
    }
});
router.get('/insights', auth_js_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const insights = await (0, circle_js_1.getRelationshipInsights)(req.user.id);
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
        const connections = await (0, circle_js_1.getConnections)(req.user.id);
        res.json({
            summary: { totalConnections: connections.length },
            connections: connections.slice(0, 10),
            timestamp: new Date().toISOString(),
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to load dashboard' });
    }
});
exports.default = router;
//# sourceMappingURL=circle.js.map