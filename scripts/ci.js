/**
 * Script de CI que garantiza el cierre de los emuladores de Firebase
 * incluso si alguno de los pasos anteriores falla.
 */

const { execSync } = require('child_process');

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit' });
}

function runSafe(cmd) {
  try {
    run(cmd);
  } catch {
    // Ignorar errores en cleanup
  }
}

let failed = false;

try {
  run('npm run lint');
  run('npm run type-check');
  run('npm run test:unit');
  run('npm run test:integration');
  run('npm run build');
} catch {
  failed = true;
} finally {
  console.log('\n> Cleanup: cerrando emuladores residuales...\n');
  runSafe('npm run kill:emulators');
}

if (failed) {
  process.exit(1);
}
