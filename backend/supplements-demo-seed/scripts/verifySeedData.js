/* eslint-disable no-console */
const { buildDataset } = require('../utils/seedDemo/build');
const { verifyDataset } = require('../utils/seedDemo/verify');

async function main() {
  console.log('[verify] Building demo dataset in memory...');
  const dataset = await buildDataset();

  console.log('[verify] Validating against real Mongoose schemas + references...');
  const { errors, counts } = await verifyDataset(dataset);

  console.log('\n[verify] Document counts:');
  Object.entries(counts).forEach(([k, v]) => console.log(`  ${k.padEnd(12)} ${v}`));

  if (errors.length) {
    console.log(`\n[verify] FAILED — ${errors.length} problem(s) found:\n`);
    errors.forEach((e) => console.log('  - ' + e));
    process.exitCode = 1;
  } else {
    console.log('\n[verify] PASSED — every document is schema-valid and every reference resolves.');
  }
}

main().catch((err) => {
  console.error('[verify] Crashed:', err);
  process.exitCode = 1;
});
