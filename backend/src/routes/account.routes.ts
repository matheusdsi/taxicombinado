import { Router, Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { prisma } from '../lib/prisma';

const router = Router();

function requireDriver(req: Request, res: Response, next: NextFunction) {
  if (!req.userId) {
    return res.status(401).json({ success: false, error: 'Entre na sua conta para salvar estes dados.' });
  }
  return next();
}

router.use(requireDriver);

const optionalText = z.string().trim().optional().or(z.literal(''));
const optionalNumber = z.coerce.number().min(0).optional().or(z.literal(''));
const optionalBoolean = z.boolean().optional();

const profileSchema = z.object({
  phone: optionalText,
  whatsapp: optionalText,
  city: optionalText,
  state: optionalText,
  taxiPoint: optionalText,
  worksWithApps: optionalBoolean,
  acceptsPix: optionalBoolean,
  acceptsCard: optionalBoolean,
  issuesReceipt: optionalBoolean,
  notes: optionalText,
}).partial();

const vehicleSchema = z.object({
  name: optionalText,
  brand: optionalText,
  model: optionalText,
  year: z.coerce.number().int().min(1950).max(2100).optional().or(z.literal('')),
  plateNickname: optionalText,
  fuelType: optionalText,
  consumptionKmPerLiter: optionalNumber,
  extraCostPerKm: optionalNumber,
  monthlyInstallment: optionalNumber,
  monthlyInsurance: optionalNumber,
  monthlyProtection: optionalNumber,
  monthlyRental: optionalNumber,
  monthlyParking: optionalNumber,
  notes: optionalText,
}).partial();

const costsSchema = z.object({
  personalIncomeGoal: optionalNumber,
  workDaysPerMonth: optionalNumber,
  hoursPerDay: optionalNumber,
  monthlyKmEstimate: optionalNumber,
  fuelMonthlyEstimate: optionalNumber,
  carInstallment: optionalNumber,
  carRental: optionalNumber,
  insurance: optionalNumber,
  vehicleProtection: optionalNumber,
  maintenanceReserve: optionalNumber,
  tireReserve: optionalNumber,
  oilReserve: optionalNumber,
  washing: optionalNumber,
  parking: optionalNumber,
  tollTag: optionalNumber,
  phoneBill: optionalNumber,
  appFees: optionalNumber,
  accountant: optionalNumber,
  licenseAndTaxes: optionalNumber,
  otherFixedCosts: optionalNumber,
  notes: optionalText,
}).partial();

const accountSchema = z.object({
  profile: profileSchema.optional(),
  vehicle: vehicleSchema.optional(),
  costs: costsSchema.optional(),
});

const maintenanceSchema = z.object({
  date: z.string().optional(),
  category: optionalText,
  description: z.string().trim().min(2, 'Descreva a manutencao'),
  amount: z.coerce.number().min(0, 'Valor invalido'),
  odometerKm: optionalNumber,
  notes: optionalText,
});

const fuelLogSchema = z.object({
  date: z.string().optional(),
  fuelType: optionalText,
  liters: optionalNumber,
  totalPaid: z.coerce.number().min(0, 'Valor invalido'),
  pricePerLiter: optionalNumber,
  odometerKm: optionalNumber,
  station: optionalText,
  city: optionalText,
});

function normalize<T extends Record<string, unknown>>(data: T): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(data)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, value === '' ? null : value])
  );
}

function numberOrZero(value: unknown): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : 0;
}

function buildSummary(costs: Record<string, unknown> | null | undefined) {
  const costKeys = [
    'fuelMonthlyEstimate',
    'carInstallment',
    'carRental',
    'insurance',
    'vehicleProtection',
    'maintenanceReserve',
    'tireReserve',
    'oilReserve',
    'washing',
    'parking',
    'tollTag',
    'phoneBill',
    'appFees',
    'accountant',
    'licenseAndTaxes',
    'otherFixedCosts',
  ];

  const monthlyCosts = costKeys.reduce((sum, key) => sum + numberOrZero(costs?.[key]), 0);
  const personalIncomeGoal = numberOrZero(costs?.personalIncomeGoal);
  const monthlyTarget = monthlyCosts + personalIncomeGoal;
  const workDays = numberOrZero(costs?.workDaysPerMonth);
  const hoursPerDay = numberOrZero(costs?.hoursPerDay);
  const monthlyKm = numberOrZero(costs?.monthlyKmEstimate);

  return {
    monthlyCosts: round2(monthlyCosts),
    monthlyTarget: round2(monthlyTarget),
    dailyTarget: workDays > 0 ? round2(monthlyTarget / workDays) : null,
    hourlyTarget: workDays > 0 && hoursPerDay > 0 ? round2(monthlyTarget / workDays / hoursPerDay) : null,
    costPerKm: monthlyKm > 0 ? round2(monthlyCosts / monthlyKm) : null,
    targetPerKm: monthlyKm > 0 ? round2(monthlyTarget / monthlyKm) : null,
  };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function getAccount(userId: string) {
  const [user, profile, vehicle, costs, maintenanceLogs, fuelLogs] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, createdAt: true },
    }),
    prisma.driverProfile.findUnique({ where: { userId } }),
    prisma.vehicle.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } }),
    prisma.driverMonthlyCost.findUnique({ where: { userId } }),
    prisma.maintenanceLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 8 }),
    prisma.fuelLog.findMany({ where: { userId }, orderBy: { date: 'desc' }, take: 8 }),
  ]);

  return {
    user,
    profile,
    vehicle,
    costs,
    maintenanceLogs,
    fuelLogs,
    summary: buildSummary(costs),
  };
}

router.get('/', async (req: Request, res: Response) => {
  try {
    return res.json({ success: true, data: await getAccount(req.userId!) });
  } catch (error) {
    console.error('Account fetch error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao carregar sua conta.' });
  }
});

router.put('/', async (req: Request, res: Response) => {
  try {
    const input = accountSchema.parse(req.body);
    const userId = req.userId!;

    if (input.profile) {
      await prisma.driverProfile.upsert({
        where: { userId },
        create: { userId, ...normalize(input.profile) },
        update: normalize(input.profile),
      });
    }

    if (input.costs) {
      await prisma.driverMonthlyCost.upsert({
        where: { userId },
        create: { userId, ...normalize(input.costs) },
        update: normalize(input.costs),
      });
    }

    if (input.vehicle) {
      const data = normalize(input.vehicle);
      const existing = await prisma.vehicle.findFirst({ where: { userId }, orderBy: { createdAt: 'asc' } });
      if (existing) {
        await prisma.vehicle.update({ where: { id: existing.id }, data });
      } else {
        await prisma.vehicle.create({
          data: {
            userId,
            name: String(data.name || 'Meu taxi'),
            fuelType: String(data.fuelType || 'gasoline'),
            consumptionKmPerLiter: Number(data.consumptionKmPerLiter || 10),
            extraCostPerKm: Number(data.extraCostPerKm || 0),
            brand: data.brand as string | null,
            model: data.model as string | null,
            year: data.year as number | null,
            plateNickname: data.plateNickname as string | null,
            monthlyInstallment: data.monthlyInstallment as number | null,
            monthlyInsurance: data.monthlyInsurance as number | null,
            monthlyProtection: data.monthlyProtection as number | null,
            monthlyRental: data.monthlyRental as number | null,
            monthlyParking: data.monthlyParking as number | null,
            notes: data.notes as string | null,
          },
        });
      }
    }

    return res.json({ success: true, data: await getAccount(userId) });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: 'Dados invalidos', details: error.errors });
    }
    console.error('Account update error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao salvar sua conta.' });
  }
});

router.post('/maintenance', async (req: Request, res: Response) => {
  try {
    const input = maintenanceSchema.parse(req.body);
    const log = await prisma.maintenanceLog.create({
      data: {
        userId: req.userId!,
        date: input.date ? new Date(input.date) : new Date(),
        category: input.category || null,
        description: input.description,
        amount: input.amount,
        odometerKm: input.odometerKm === '' ? null : input.odometerKm,
        notes: input.notes || null,
      },
    });
    return res.status(201).json({ success: true, data: log });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error('Maintenance create error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao salvar manutencao.' });
  }
});

router.post('/fuel-logs', async (req: Request, res: Response) => {
  try {
    const input = fuelLogSchema.parse(req.body);
    const log = await prisma.fuelLog.create({
      data: {
        userId: req.userId!,
        date: input.date ? new Date(input.date) : new Date(),
        fuelType: input.fuelType || 'gasoline',
        liters: input.liters === '' ? null : input.liters,
        totalPaid: input.totalPaid,
        pricePerLiter: input.pricePerLiter === '' ? null : input.pricePerLiter,
        odometerKm: input.odometerKm === '' ? null : input.odometerKm,
        station: input.station || null,
        city: input.city || null,
      },
    });
    return res.status(201).json({ success: true, data: log });
  } catch (error) {
    if (error instanceof ZodError) {
      return res.status(400).json({ success: false, error: error.errors[0].message });
    }
    console.error('Fuel log create error:', error);
    return res.status(500).json({ success: false, error: 'Erro ao salvar abastecimento.' });
  }
});

export default router;
