secretcli tx compute execute $(head -n 1 contract-addresses.log) \
    '{"send_ibc_packet": {"message": "this is an ibc packet"}}' --from d -y

sleep 2

docker exec local-ibc-compose-relayer-1                                 \
    hermes --config /home/hermes-user/.hermes/alternative-config.toml   \
    tx packet-recv --dst-chain secretdev-2 --src-chain secretdev-1      \
    --src-port wasm.$(head -n 1 ./contract-addresses.log)               \
    --src-channel channel-1

sleep 2

docker exec local-ibc-compose-relayer-1                                 \
    hermes --config /home/hermes-user/.hermes/alternative-config.toml   \
    tx packet-ack --dst-chain secretdev-2 --src-chain secretdev-1       \
    --src-port wasm.$(head -n 1 ./contract-addresses.log)               \
    --src-channel channel-1

