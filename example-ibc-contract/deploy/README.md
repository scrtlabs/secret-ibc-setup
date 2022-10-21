## Secret Inter-Contract IBC setup
Two contracts, on two different local secrets, can Inter-blockchainly, directly communicate with each other via a Hermes relayer

---
(first two steps are the same as with the regular ibc)
#### Build
```bash
docker build -f hermes.Dockerfile . --tag hermes:test
```

#### Run
```bash
docker compose up
```

### Run the Monitoring script
This script queries the two contracts continuously, which lets us see the state of the IBC objects within the contract,
as well as the flow of messages between the blockchains that is relayed by hermes.
Keep this terminal in the background, and return to it after every stage in the future to see what happens.
```bash
./query-contracts.sh
```

### Upload the contracts
In another terminal, The test script will store the contracts, instantiate them, save their address to helper files
```bash
yarn test
```

### Tell the relayer to open a channel between the contracts
```bash
./create-channel.sh
```
How did the contract's queries change?

### Send a packet and relay it to the other chain
```bash
./send-packet.sh
```
How did the contract's queries change?
