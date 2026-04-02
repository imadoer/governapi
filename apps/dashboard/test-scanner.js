const path = require('path');

// Test if we can load your scanner modules
try {
  console.log('Loading scanner modules...');
  const discoveryScanner = require(path.join(process.env.HOME, 'src/discovery/scanner.ts'));
  const securityScanner = require(path.join(process.env.HOME, 'src/security/scanner.ts'));
  console.log('Scanner modules loaded successfully!');
  console.log('Available functions:', {
    discovery: Object.keys(discoveryScanner),
    security: Object.keys(securityScanner)
  });
} catch (error) {
  console.error('Failed to load scanner:', error.message);
  console.log('\nYour scanner likely needs to be compiled from TypeScript to JavaScript first.');
}
