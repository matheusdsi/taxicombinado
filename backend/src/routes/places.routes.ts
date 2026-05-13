import { Router, Request, Response } from 'express';

const router = Router();

// GET /api/places/autocomplete?q=...
router.get('/autocomplete', async (req: Request, res: Response) => {
  const q = (req.query.q as string)?.trim();
  if (!q || q.length < 3) {
    return res.json({ suggestions: [] });
  }

  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    return res.status(503).json({ error: 'Serviço de endereços não configurado' });
  }

  try {
    const url =
      `https://maps.googleapis.com/maps/api/place/autocomplete/json` +
      `?input=${encodeURIComponent(q)}` +
      `&key=${apiKey}` +
      `&language=pt-BR` +
      `&components=country:br` +
      `&location=-23.5505,-46.6333` +
      `&radius=100000`;

    const response = await fetch(url);
    if (!response.ok) {
      return res.status(502).json({ error: 'Erro ao buscar sugestões' });
    }

    const data = await response.json() as {
      status: string;
      predictions: Array<{
        description: string;
        place_id: string;
      }>;
    };

    if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
      console.error('Google Places error:', data.status);
      return res.status(502).json({ error: 'Erro ao buscar sugestões' });
    }

    const suggestions = (data.predictions ?? []).map((p) => ({
      label: p.description,
      place_id: p.place_id,
    }));

    return res.json({ suggestions });
  } catch (err) {
    console.error('Places autocomplete error:', err);
    return res.status(500).json({ error: 'Erro interno' });
  }
});

export default router;
