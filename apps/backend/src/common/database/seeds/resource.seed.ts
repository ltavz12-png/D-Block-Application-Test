import { DataSource } from 'typeorm';
import { Resource, ResourceType, MeasurementUnit, PricingModel } from '../entities/resource.entity';
import { Location } from '../entities/location.entity';
import * as fs from 'fs';
import * as path from 'path';

// Parse xlsx using built-in Node.js zip + XML parsing (no external deps)
import { createReadStream } from 'fs';
import * as zlib from 'zlib';

interface RawResource {
  source: string;
  businessName: string;
  name: string;
  area: string;
  size: number;
  capacity: number;
  floorPlan: string;
  type: string;
  measurement: string;
}

function parseXlsxNative(filePath: string): RawResource[] {
  // Use child_process to call python for xlsx parsing since we don't have openpyxl
  const { execSync } = require('child_process');
  const pythonScript = `
import zipfile, xml.etree.ElementTree as ET, json, sys

xlsx = sys.argv[1]
results = []
with zipfile.ZipFile(xlsx) as z:
    strings = []
    if 'xl/sharedStrings.xml' in z.namelist():
        tree = ET.parse(z.open('xl/sharedStrings.xml'))
        ns = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
        for si in tree.findall('.//s:si', ns):
            text = ''.join(t.text or '' for t in si.findall('.//s:t', ns))
            strings.append(text)

    tree = ET.parse(z.open('xl/worksheets/sheet1.xml'))
    rows = tree.findall('.//{http://schemas.openxmlformats.org/spreadsheetml/2006/main}row')

    for row in rows[1:]:
        cells = row.findall('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}c')
        vals = []
        for c in cells:
            v = c.find('{http://schemas.openxmlformats.org/spreadsheetml/2006/main}v')
            val = v.text if v is not None else ''
            if c.get('t') == 's' and val:
                val = strings[int(val)] if int(val) < len(strings) else val
            vals.append(val)
        if len(vals) >= 10:
            results.append({
                'source': vals[0],
                'businessName': vals[2],
                'name': vals[3],
                'area': vals[4],
                'size': float(vals[5]) if vals[5] else 0,
                'capacity': int(float(vals[6])) if vals[6] else 0,
                'floorPlan': vals[7],
                'type': vals[9],
                'measurement': vals[10] if len(vals) > 10 else 'SQM'
            })

print(json.dumps(results))
`;

  const result = execSync(`python3 -c ${JSON.stringify(pythonScript)} ${JSON.stringify(filePath)}`, {
    encoding: 'utf-8',
    maxBuffer: 10 * 1024 * 1024,
  });

  return JSON.parse(result);
}

function mapResourceType(type: string): ResourceType {
  const map: Record<string, ResourceType> = {
    'Office': ResourceType.OFFICE,
    'Box': ResourceType.BOX,
    'Hot Desk': ResourceType.HOT_DESK,
    'Fixed Desk': ResourceType.FIXED_DESK,
    'PAX': ResourceType.FIXED_DESK,
  };
  return map[type] || ResourceType.OFFICE;
}

function mapMeasurement(measurement: string): MeasurementUnit {
  return measurement === 'PAX' ? MeasurementUnit.PAX : MeasurementUnit.SQM;
}

function mapPricingModel(type: string): PricingModel {
  const map: Record<string, PricingModel> = {
    'Office': PricingModel.PER_SQM,
    'Box': PricingModel.MONTHLY,
    'Hot Desk': PricingModel.DAILY,
    'Fixed Desk': PricingModel.MONTHLY,
    'PAX': PricingModel.MONTHLY,
  };
  return map[type] || PricingModel.MONTHLY;
}

export async function seedResources(dataSource: DataSource): Promise<void> {
  const resourceRepo = dataSource.getRepository(Resource);
  const locationRepo = dataSource.getRepository(Location);

  // Find xlsx file
  const xlsxPath = path.resolve(
    __dirname,
    '../../../../../../Areas Available.xlsx',
  );

  if (!fs.existsSync(xlsxPath)) {
    console.warn(`XLSX file not found at ${xlsxPath}, skipping resource seed`);
    return;
  }

  console.log(`Parsing resources from ${xlsxPath}...`);
  const rawResources = parseXlsxNative(xlsxPath);
  console.log(`Found ${rawResources.length} resources in XLSX`);

  // Load locations
  const locations = await locationRepo.find();
  const locationMap = new Map<string, string>();
  for (const loc of locations) {
    locationMap.set(loc.name, loc.id);
  }

  let created = 0;
  let skipped = 0;

  for (const raw of rawResources) {
    const locationId = locationMap.get(raw.businessName);
    if (!locationId) {
      console.warn(`Unknown location: ${raw.businessName}, skipping ${raw.name}`);
      skipped++;
      continue;
    }

    const existing = await resourceRepo.findOne({
      where: { name: raw.name, locationId },
    });

    if (existing) {
      skipped++;
      continue;
    }

    await resourceRepo.save(
      resourceRepo.create({
        name: raw.name,
        locationId,
        resourceType: mapResourceType(raw.type),
        block: raw.area && raw.area !== '0' ? raw.area : null,
        floor: raw.floorPlan || null,
        size: raw.size,
        measurementUnit: mapMeasurement(raw.measurement),
        capacity: raw.capacity,
        pricingModel: mapPricingModel(raw.type),
        isActive: true,
        isBookable: ['Hot Desk', 'Box', 'PAX'].includes(raw.type)
          || raw.type === 'Office',
        amenities: [],
        imageUrls: [],
      }),
    );
    created++;
  }

  console.log(`Resources: ${created} created, ${skipped} skipped`);
}
