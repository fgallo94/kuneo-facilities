/**
 * Mata los procesos que mantienen ocupados los puertos del Firebase Emulator Suite.
 * Seguro para desarrollo local; no afecta servicios en la nube.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const PORTS = [8081, 9091, 5001];

function killWindows() {
  const psScript = PORTS.map((port) => `
$conn = Get-NetTCPConnection -LocalPort ${port} -ErrorAction SilentlyContinue
if ($conn) {
  $p = $conn | Select-Object -ExpandProperty OwningProcess -First 1
  if ($p -and $p -ne 0 -and $p -ne 4) {
    Write-Host "Puerto ${port} ocupado por PID $p. Matando proceso..."
    Stop-Process -Id $p -Force -ErrorAction SilentlyContinue
  } else {
    Write-Host "Puerto ${port} libre (PID no matable: $p)."
  }
} else {
  Write-Host "Puerto ${port} libre."
}
`).join('\n');

  const tmpFile = path.join(__dirname, `kill-emulators-${Date.now()}.ps1`);
  fs.writeFileSync(tmpFile, psScript, { encoding: 'utf8' });
  try {
    execSync(`powershell -NoProfile -ExecutionPolicy Bypass -File "${tmpFile}"`, { stdio: 'inherit' });
  } finally {
    try {
      fs.unlinkSync(tmpFile);
    } catch {
      // ignore
    }
  }
}

function killUnix() {
  PORTS.forEach((port) => {
    try {
      const pid = execSync(`lsof -t -i:${port}`).toString().trim();
      if (pid) {
        console.log(`Puerto ${port} ocupado por PID ${pid}. Matando proceso...`);
        execSync(`kill -9 ${pid}`);
      }
    } catch {
      console.log(`Puerto ${port} libre.`);
    }
  });
}

if (process.platform === 'win32') {
  killWindows();
} else {
  killUnix();
}
