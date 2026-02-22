import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { seedUsers } from './user.seed';
import { seedLocations } from './location.seed';
import { seedResources } from './resource.seed';
import { seedProducts } from './product.seed';

async function runSeeds() {
  console.log('Initializing data source...');
  const dataSource = await AppDataSource.initialize();

  try {
    console.log('Running seeds...');

    await seedUsers(dataSource);
    console.log('Users seeded.');

    await seedLocations(dataSource);
    console.log('Locations seeded.');

    await seedResources(dataSource);
    console.log('Resources seeded.');

    await seedProducts(dataSource);
    console.log('Products seeded.');

    console.log('All seeds completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();
