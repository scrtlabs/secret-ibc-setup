watch -n 0.4 "secretcli q compute query $(head -n 1 contract-addresses.log) '{\"last_ibc_operation\":{}}' --node 'tcp://localhost:26657'"
