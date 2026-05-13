import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding partners...');

  // Clean up existing
  await prisma.partnerClick.deleteMany({});
  await prisma.partnerLead.deleteMany({});
  await prisma.partner.deleteMany({});

  const partners = [
    {
      name: 'Posto Parceiro Centro',
      category: 'fuel_station',
      description: 'Abastecimento com desconto especial para taxistas. Gasolina, etanol e GNV. Atendimento preferencial para motoristas de aplicativo e táxi.',
      websiteUrl: 'https://example.com/posto-centro',
      phone: '(11) 3333-1111',
      city: 'São Paulo',
      isActive: true,
      isPremium: true,
      sortOrder: 1,
    },
    {
      name: 'Oficina Rápida Motor',
      category: 'mechanic',
      description: 'Manutenção preventiva e corretiva para taxistas. Troca de óleo, revisão geral, freios e suspensão. Agendamento prioritário para frota.',
      websiteUrl: 'https://example.com/oficina-motor',
      phone: '(11) 3444-2222',
      city: 'São Paulo',
      isActive: true,
      isPremium: false,
      sortOrder: 2,
    },
    {
      name: 'Lava-rápido do Taxista',
      category: 'car_wash',
      description: 'Lavagem completa com preço especial para táxis e motoristas de app. Higienização interna, polimento e proteção. Atendimento rápido sem fila.',
      websiteUrl: 'https://example.com/lava-rapido',
      phone: '(11) 3555-3333',
      city: 'São Paulo',
      isActive: true,
      isPremium: false,
      sortOrder: 3,
    },
    {
      name: 'Tag Pedágio Fácil',
      category: 'toll_tag',
      description: 'Solução completa de tag de pedágio para taxistas. Sem mensalidade no primeiro ano, cobertura em todas as rodovias de SP. Gestão online da conta.',
      websiteUrl: 'https://example.com/tag-pedagio',
      phone: '0800-123-4567',
      city: 'Online',
      isActive: true,
      isPremium: true,
      sortOrder: 4,
    },
    {
      name: 'Proteção Auto Motorista',
      category: 'vehicle_protection',
      description: 'Proteção veicular com cobertura especial para táxi e motoristas profissionais. Assistência 24h, guincho, carro reserva e cobertura de terceiros.',
      websiteUrl: 'https://example.com/protecao-auto',
      phone: '0800-987-6543',
      city: 'Online',
      isActive: true,
      isPremium: false,
      sortOrder: 5,
    },
  ];

  for (const partner of partners) {
    await prisma.partner.create({ data: partner });
  }

  console.log(`Seeded ${partners.length} partners successfully.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
