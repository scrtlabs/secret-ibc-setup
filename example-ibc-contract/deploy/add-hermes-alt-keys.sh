#! /usr/bin/bash

relayer="local-ibc-compose-relayer-1"

docker cp ./hermes-alternative-config.toml $relayer:/home/hermes-user/.hermes/alternative-config.toml

docker cp ./d.mnemonic $relayer:/home/hermes-user/c.mnemonic
docker exec $relayer hermes keys add --hd-path "m/44'/529'/0'/0/0" --mnemonic-file /home/hermes-user/c.mnemonic --chain secretdev-1
docker exec $relayer hermes keys add --hd-path "m/44'/529'/0'/0/0" --mnemonic-file /home/hermes-user/c.mnemonic --chain secretdev-2

docker cp ./d.mnemonic $relayer:/home/hermes-user/d.mnemonic
docker exec $relayer hermes keys add --hd-path "m/44'/529'/0'/0/0" --mnemonic-file /home/hermes-user/d.mnemonic --chain secretdev-1 --key-name local1-alt
docker exec $relayer hermes keys add --hd-path "m/44'/529'/0'/0/0" --mnemonic-file /home/hermes-user/d.mnemonic --chain secretdev-2 --key-name local2-alt
