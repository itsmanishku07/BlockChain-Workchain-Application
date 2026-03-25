const fs = require('fs');
const path = require('path');

// Read the contract artifact
const artifactPath = path.join(__dirname, '../build/contracts/FreelanceMarketplace.json');
const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));

// Get all network IDs
const networkIds = Object.keys(artifact.networks);

if (networkIds.length === 0) {
    console.error('❌ Contract not deployed! Run: truffle migrate --reset');
    process.exit(1);
}

// Get the latest deployment
const latestNetworkId = networkIds[networkIds.length - 1];
const contractAddress = artifact.networks[latestNetworkId].address;

console.log('✅ Contract Address:', contractAddress);

// Write to public folder
const outputPath = path.join(__dirname, '../public/contract-address.json');
fs.writeFileSync(outputPath, JSON.stringify({ address: contractAddress }, null, 2));

console.log('✅ Contract address saved to public/contract-address.json');
console.log('\nYou can now run: npm start');
