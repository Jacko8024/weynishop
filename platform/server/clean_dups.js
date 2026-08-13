import 'dotenv/config';
import { SurpriseService, SurpriseBooking } from './src/models/index.js';

async function run() {
  console.log('Starting cleanup...');
  const all = await SurpriseService.findAll({ order: [['id', 'ASC']] });
  const seenGroups = new Map();
  let deleted = 0;

  for (const s of all) {
    const key = `${s.groupId}-${s.name}`;
    if (seenGroups.has(key)) {
      console.log(`Duplicate found: ${s.id} (${s.name}) in ${s.groupId}`);
      const originalId = seenGroups.get(key);
      
      // Update any bookings that pointed to this duplicate to point to the original
      await SurpriseBooking.update({ serviceId: originalId }, { where: { serviceId: s.id } });
      
      // Now safe to destroy
      await s.destroy();
      deleted++;
    } else {
      seenGroups.set(key, s.id);
    }
  }

  console.log(`Cleanup complete. Deleted: ${deleted}. Remaining: ${seenGroups.size}`);
  const remaining = await SurpriseService.count();
  console.log(`Database count: ${remaining}`);
  process.exit(0);
}

run().catch(e => {
  console.error(e);
  process.exit(1);
});
