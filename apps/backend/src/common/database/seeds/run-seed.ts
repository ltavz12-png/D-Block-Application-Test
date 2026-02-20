import { DataSource } from 'typeorm';
import { AppDataSource } from '../data-source';
import { seedLocations } from './location.seed';
import { seedResources } from './resource.seed';

async function runSeeds() {
  console.log('Initializing data source...');
  const dataSource = await AppDataSource.initialize();

  try {
    console.log('Running seeds...');

    await seedLocations(dataSource);
    console.log('Locations seeded.');

    await seedResources(dataSource);
    console.log('Resources seeded.');

    console.log('All seeds completed successfully.');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await dataSource.destroy();
  }
}

runSeeds();
