"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const supabase_1 = require("../services/supabase");
const router = express_1.default.Router();
// GET /api/budget - Get current budget allocation
router.get('/', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        // Get income total
        const { data: incomeData } = await supabase_1.supabase
            .from('income')
            .select('amount')
            .eq('user_id', userId);
        const totalIncome = (incomeData || []).reduce((sum, item) => sum + (item.amount || 0), 0);
        // Get liabilities total
        const { data: liabilityData } = await supabase_1.supabase
            .from('liabilities')
            .select('amount')
            .eq('user_id', userId);
        const totalLiabilities = (liabilityData || []).reduce((sum, item) => sum + (item.amount || 0), 0);
        // Get expenses total
        const { data: expenseData } = await supabase_1.supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', userId);
        const totalExpenses = (expenseData || []).reduce((sum, item) => sum + (item.amount || 0), 0);
        const remaining = totalIncome - totalLiabilities - totalExpenses;
        res.json({
            income: totalIncome,
            liabilities: totalLiabilities,
            expenses: totalExpenses,
            remaining,
            status: remaining >= 0 ? 'healthy' : 'deficit',
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST /api/budget/allocate - Allocate budget
router.post('/allocate', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { category, amount, description } = req.body;
        if (!category || amount === undefined) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        // Determine which table based on category
        let table = 'expenses';
        if (category === 'liability')
            table = 'liabilities';
        if (category === 'savings')
            table = 'savings';
        const { data, error } = await supabase_1.supabase
            .from(table)
            .insert([
            {
                user_id: userId,
                name: category,
                amount,
                description,
            },
        ])
            .select()
            .single();
        if (error)
            throw error;
        res.status(201).json(data);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// GET /api/budget/forecast - Get budget forecast
router.get('/forecast', auth_1.authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        // Get current budget
        const { data: incomeData } = await supabase_1.supabase
            .from('income')
            .select('amount, frequency')
            .eq('user_id', userId);
        const { data: liabilityData } = await supabase_1.supabase
            .from('liabilities')
            .select('amount')
            .eq('user_id', userId);
        const { data: expenseData } = await supabase_1.supabase
            .from('expenses')
            .select('amount')
            .eq('user_id', userId);
        const totalIncome = (incomeData || []).reduce((sum, item) => sum + (item.amount || 0), 0);
        const totalLiabilities = (liabilityData || []).reduce((sum, item) => sum + (item.amount || 0), 0);
        const totalExpenses = (expenseData || []).reduce((sum, item) => sum + (item.amount || 0), 0);
        const forecast = {
            monthly: {
                income: totalIncome,
                liabilities: totalLiabilities,
                expenses: totalExpenses,
                remaining: totalIncome - totalLiabilities - totalExpenses,
            },
            annual: {
                income: totalIncome * 12,
                liabilities: totalLiabilities * 12,
                expenses: totalExpenses * 12,
                remaining: (totalIncome - totalLiabilities - totalExpenses) * 12,
            },
            healthScore: (totalIncome - totalLiabilities - totalExpenses) / totalIncome,
        };
        res.json(forecast);
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
//# sourceMappingURL=budget.js.map