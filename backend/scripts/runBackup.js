const { spawn } = require('child_process');
const path = require('path');

const runBackup = () => {
  const scriptPath = path.resolve(__dirname, '../../scripts/backup.sh');
  
  console.log('Executing backup script:', scriptPath);

  const backupProcess = spawn('bash', [scriptPath]);

  backupProcess.stdout.on('data', (data) => {
    console.log(`stdout: ${data}`);
  });

  backupProcess.stderr.on('data', (data) => {
    console.error(`stderr: ${data}`);
  });

  backupProcess.on('close', (code) => {
    if (code === 0) {
      console.log('Backup script finished successfully.');
    } else {
      console.error(`Backup script exited with code ${code}`);
    }
  });
};

runBackup();
