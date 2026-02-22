import { DataSource } from 'typeorm';
import { Product, ProductType, BillingPeriod } from '../entities/product.entity';
import { RateCode } from '../entities/rate-code.entity';

interface ProductSeedData {
  name: string;
  nameKa: string;
  description: string;
  descriptionKa: string;
  productType: ProductType;
  billingPeriod: BillingPeriod;
  features: string[];
  sortOrder: number;
  includedResources: { resourceType: string; hoursPerMonth?: number; description?: string }[] | null;
  rates: { code: string; name: string; nameKa: string; amount: number; billingLabel?: string }[];
}

const PRODUCTS: ProductSeedData[] = [
  {
    name: 'Free Community',
    nameKa: 'უფასო საზოგადოება',
    description: 'Basic community access with WiFi and common areas',
    descriptionKa: 'საბაზისო წვდომა WiFi-ით და საერთო სივრცეებით',
    productType: ProductType.COWORKING_PASS,
    billingPeriod: BillingPeriod.MONTHLY,
    features: ['WiFi access', 'Common area access', 'Community events'],
    sortOrder: 0,
    includedResources: null,
    rates: [{ code: 'FREE-MONTHLY', name: 'Free Monthly', nameKa: 'უფასო თვიური', amount: 0 }],
  },
  {
    name: 'Day Pass',
    nameKa: 'დღიური აბონემენტი',
    description: 'Full day access to hot desks and amenities',
    descriptionKa: 'სრული დღის წვდომა თავისუფალ მაგიდებსა და კეთილმოწყობაზე',
    productType: ProductType.COWORKING_PASS,
    billingPeriod: BillingPeriod.DAILY,
    features: ['Hot desk access', 'WiFi', 'Coffee & tea', 'Common areas', 'Printing (10 pages)'],
    sortOrder: 1,
    includedResources: [{ resourceType: 'hot_desk', description: 'Any available hot desk' }],
    rates: [{ code: 'DAY-PASS', name: 'Day Pass', nameKa: 'დღიური', amount: 25 }],
  },
  {
    name: 'Starter Plan',
    nameKa: 'სტარტერი',
    description: '10 hot desk days per month with meeting room access',
    descriptionKa: '10 დღე თავისუფალი მაგიდა თვეში საკონფერენციო ოთახით',
    productType: ProductType.COWORKING_PASS,
    billingPeriod: BillingPeriod.MONTHLY,
    features: [
      '10 hot desk days/month',
      'WiFi',
      'Coffee & tea',
      'Meeting room (2hrs/month)',
      'Locker access',
      'Community events',
    ],
    sortOrder: 2,
    includedResources: [
      { resourceType: 'hot_desk', hoursPerMonth: 80, description: '10 days per month' },
      { resourceType: 'meeting_room', hoursPerMonth: 2, description: '2 hours per month' },
    ],
    rates: [
      { code: 'STARTER-MONTHLY', name: 'Starter Monthly', nameKa: 'სტარტერი თვიური', amount: 350 },
      { code: 'STARTER-ANNUAL', name: 'Starter Annual', nameKa: 'სტარტერი წლიური', amount: 3500 },
    ],
  },
  {
    name: 'Premium Plan',
    nameKa: 'პრემიუმი',
    description: 'Unlimited access with fixed desk and priority amenities',
    descriptionKa: 'შეუზღუდავი წვდომა ფიქსირებული მაგიდით და პრიორიტეტული კეთილმოწყობით',
    productType: ProductType.COWORKING_PASS,
    billingPeriod: BillingPeriod.MONTHLY,
    features: [
      'Unlimited hot desk',
      'Fixed desk access',
      'WiFi',
      'Coffee & tea',
      'Meeting room (8hrs/month)',
      '24/7 access',
      'Printing (100 pages)',
      'Mail handling',
    ],
    sortOrder: 3,
    includedResources: [
      { resourceType: 'hot_desk', description: 'Unlimited access' },
      { resourceType: 'fixed_desk', description: 'Dedicated desk' },
      { resourceType: 'meeting_room', hoursPerMonth: 8, description: '8 hours per month' },
    ],
    rates: [
      { code: 'PREMIUM-MONTHLY', name: 'Premium Monthly', nameKa: 'პრემიუმი თვიური', amount: 850 },
      { code: 'PREMIUM-ANNUAL', name: 'Premium Annual', nameKa: 'პრემიუმი წლიური', amount: 8500 },
    ],
  },
  {
    name: 'Credit Package 100',
    nameKa: 'კრედიტ პაკეტი 100',
    description: '100 credits for any workspace booking',
    descriptionKa: '100 კრედიტი ნებისმიერი სივრცის დაჯავშნისთვის',
    productType: ProductType.CREDIT_PACKAGE,
    billingPeriod: BillingPeriod.ONE_TIME,
    features: ['100 credits', 'Use for any resource', 'Never expires'],
    sortOrder: 4,
    includedResources: null,
    rates: [{ code: 'CREDITS-100', name: '100 Credits', nameKa: '100 კრედიტი', amount: 200 }],
  },
];

export async function seedProducts(dataSource: DataSource): Promise<void> {
  const productRepo = dataSource.getRepository(Product);
  const rateCodeRepo = dataSource.getRepository(RateCode);

  let created = 0;
  let skipped = 0;

  for (const seed of PRODUCTS) {
    const existing = await productRepo.findOne({ where: { name: seed.name } });
    if (existing) {
      skipped++;
      continue;
    }

    const product = await productRepo.save(
      productRepo.create({
        name: seed.name,
        nameKa: seed.nameKa,
        description: seed.description,
        descriptionKa: seed.descriptionKa,
        productType: seed.productType,
        billingPeriod: seed.billingPeriod,
        features: seed.features,
        sortOrder: seed.sortOrder,
        includedResources: seed.includedResources,
        isActive: true,
      }),
    );

    for (const rate of seed.rates) {
      await rateCodeRepo.save(
        rateCodeRepo.create({
          code: rate.code,
          name: rate.name,
          nameKa: rate.nameKa,
          productId: product.id,
          amount: rate.amount,
          currency: 'GEL',
          taxInclusive: true,
          taxRate: 18,
          isActive: true,
        }),
      );
    }

    created++;
  }

  console.log(`Products: ${created} created, ${skipped} skipped`);
}
