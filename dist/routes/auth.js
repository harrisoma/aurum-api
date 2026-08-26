"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../services/supabase");
const router = (0, express_1.Router)();
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data, error } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
            email,
            password,
        });
        if (error) {
            return res.status(401).json({ error: error.message });
        }
        res.json({
            token: data.session?.access_token,
            user: data.user,
            session: data.session,
        });
    }
    catch (error) {
        console.error('Auth error:', error);
        res.status(500).json({ error: 'Auth failed' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map