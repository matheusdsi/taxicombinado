import { z } from 'zod';

export const partnerClickSchema = z.object({
  partnerId: z.string().uuid(),
  partnerLocationId: z.string().uuid().optional(),
  source: z.string().optional(),
});

export const partnerLeadSchema = z.object({
  partnerId: z.string().uuid(),
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
  phone: z.string().min(10, 'Telefone inválido'),
  email: z.string().email().optional().or(z.literal('')),
  message: z.string().optional(),
});

export const becomePartnerSchema = z.object({
  companyName: z.string().min(2),
  category: z.string(),
  contactName: z.string().min(2),
  phone: z.string().min(10),
  email: z.string().email(),
  city: z.string().min(2),
  message: z.string().optional(),
});

export const feedbackSchema = z.object({
  rating: z.number().int().min(1).max(5),
  category: z.string().optional(),
  message: z.string().max(1000).optional(),
  page: z.string().optional(),
});
