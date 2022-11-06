docker exec -it local-ibc-compose-relayer-1                                 \
    hermes --config /home/hermes-user/.hermes/alternative-config.toml   \
    create channel                                                      \
    --a-chain secretdev-1                                               \
    --b-chain secretdev-2                                               \
    --a-port wasm.$(head -n 1 ./contract-addresses.log)                 \
    --b-port wasm.$(tail -n 1 ./contract-addresses.log)                 \
    --new-client-connection
    -y
