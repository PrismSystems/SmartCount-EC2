const { execSync } = require('child_process');

try {
  execSync('npx tsc', { 
    stdio: 'inherit',
    env: { 
      ...process.env, 
      NODE_OPTIONS: '--max-old-space-size=4096' 
    }
  });
} catch (error) {
  console.error('Build failed:', error.message);
  process.exit(1);
}