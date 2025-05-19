import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { term } = req.body;

    const { error } = await supabase
      .from('search_logs')
      .insert([{ term }]);

    if (error) {
      console.error('Insert error:', error);
      return res.status(500).json({ message: error.message });
    }

    return res.status(200).json({ message: 'Search logged' });
  }

  res.status(405).json({ message: 'Method Not Allowed' });
}
