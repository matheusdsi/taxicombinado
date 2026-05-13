import { Router, Request, Response } from 'express';
import { prisma } from '../lib/prisma';
import { z, ZodError } from 'zod';

const router = Router();

const rideRequestSchema = z.object({
  passengerName: z.string().min(2, 'Informe seu nome'),
  passengerPhone: z.string().min(10, 'Informe um telefone válido'),
  originAddress: z.string().min(3, 'Informe o endereço de origem'),
  destinationAddress: z.string().min(3, 'Informe o endereço de destino'),
  scheduledDate: z.string().min(1, 'Informe a data'),
  scheduledTime: z.string().min(1, 'Informe o horário'),
  passengerCount: z.number().int().min(1).max(15).default(1),
  needsLargeVehicle: z.boolean().default(false),
  needsAccessibility: z.boolean().default(false),
  hasLuggage: z.boolean().default(false),
  notes: z.string().optional(),
  estimatedPriceMin: z.number().min(0).optional(),
  estimatedPriceMax: z.number().min(0).optional(),
  estimatedDistanceKm: z.number().min(0).optional(),
});

// POST /api/ride-requests
router.post('/', async (req: Request, res: Response) => {
  try {
    const data = rideRequestSchema.parse(req.body);

    const rideRequest = await prisma.rideRequest.create({ data });

    const whatsappNumber = '5511972660228';
    const passengerCount = data.passengerCount ?? 1;
    const largeVehicle = data.needsLargeVehicle ? 'Sim' : 'Não';
    const accessibility = data.needsAccessibility ? 'Sim' : 'Não';
    const luggage = data.hasLuggage ? 'Sim' : 'Não';
    const priceRange =
      data.estimatedPriceMin && data.estimatedPriceMax
        ? `R$ ${data.estimatedPriceMin.toFixed(0)}–${data.estimatedPriceMax.toFixed(0)}`
        : 'Não calculada';

    const message = [
      `🚖 *Nova solicitação de corrida*`,
      ``,
      `👤 *Passageiro:* ${data.passengerName}`,
      `📱 *Telefone:* ${data.passengerPhone}`,
      ``,
      `📍 *Origem:* ${data.originAddress}`,
      `🏁 *Destino:* ${data.destinationAddress}`,
      ``,
      `📅 *Data:* ${data.scheduledDate}`,
      `🕐 *Horário:* ${data.scheduledTime}`,
      ``,
      `👥 *Passageiros:* ${passengerCount}`,
      `🚐 *Van/7 lugares:* ${largeVehicle}`,
      `♿ *Acessibilidade:* ${accessibility}`,
      `🧳 *Bagagem:* ${luggage}`,
      `💰 *Estimativa:* ${priceRange}`,
      data.notes ? `📝 *Obs:* ${data.notes}` : null,
      ``,
      `_ID: ${rideRequest.id.slice(0, 8)}_`,
    ]
      .filter(Boolean)
      .join('\n');

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

    return res.status(201).json({
      success: true,
      data: { id: rideRequest.id, whatsappUrl },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados inválidos', details: error.errors });
    }
    console.error('Error saving ride request:', error);
    return res.status(500).json({ success: false, error: 'Erro ao salvar solicitação' });
  }
});

export default router;
