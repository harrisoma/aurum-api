import { Router } from 'express';
import { supabaseAdmin } from '../services/supabase';

const router = Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const { data, error } = await supabaseAdmin.auth.signInWithPassword({
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
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).json({ error: 'Auth failed' });
  }
});

export default router;
