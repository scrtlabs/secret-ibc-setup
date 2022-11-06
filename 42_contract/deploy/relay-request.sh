docker exec local-ibc-compose-relayer-1                                 \
    hermes --config /home/hermes-user/.hermes/alternative-config.toml   \
    tx packet-recv --dst-chain secretdev-2 --src-chain secretdev-1      \
    --src-port wasm.$(head -n 1 ./contract-addresses.log)               \
    --src-channel channel-0
