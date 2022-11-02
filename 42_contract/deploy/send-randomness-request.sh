secretcli tx compute execute $(head -n 1 contract-addresses.log) \
    '{"request_randomness_from_other_chain": {"job_id": "job-id-that-I-set"}}' --from d -y

sleep 4

docker exec local-ibc-compose-relayer-1                                 \
    hermes --config /home/hermes-user/.hermes/alternative-config.toml   \
    tx packet-recv --dst-chain secretdev-2 --src-chain secretdev-1      \
    --src-port wasm.$(head -n 1 ./contract-addresses.log)               \
    --src-channel channel-1

sleep 4

docker exec local-ibc-compose-relayer-1                                 \
    hermes --config /home/hermes-user/.hermes/alternative-config.toml   \
    tx packet-ack --dst-chain secretdev-2 --src-chain secretdev-1       \
    --src-port wasm.$(head -n 1 ./contract-addresses.log)               \
    --src-channel channel-1

