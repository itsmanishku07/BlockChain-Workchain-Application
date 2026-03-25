cd blockchain
truffle migrate --reset --network development
cd ..
Copy-Item -Path "blockchain\\build\\contracts\\*.json" -Destination "frontend\\src\\contracts\\" -Force
Write-Host "Contracts migrated and ABIs copied to frontend successfully!"
