# Build with:
# docker build -f hermes.Dockerfile . -t hermes:latest
# FROM golang:latest
FROM ubuntu:latest

# install rust  
#RUN ["curl", "--proto", "'=https'", "--tlsv1.2", "-sSf", "https://sh.rustup.rs", "|", "sh"]

# install hermes
ADD ["./hermes-v1.0.0-rc.2-x86_64-unknown-linux-gnu.tar.gz", "/hermes-installation"]


ENV PATH="${PATH}:/hermes-installation"

# create code directory
#CD ["wget", "https://github.com/informalsystems/ibc-rs/releases/download/v1.0.0-rc.2/hermes-v1.0.0-rc.2-aarch64-unknown-linux-gnu.tar.gz"]
#echo "grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar" > 50s03.mnemonic
#hermes keys add --hd-path "m/44'/529'/0'/0/0" --mnemonic-file 50s03.mnemonic --chain secretdev-1
#hermes keys add --hd-path "m/44'/529'/0'/0/0" --mnemonic-file 50s03.mnemonic --chain secretdev-2

## enable unsafe cors in the configuration file:
#RUN ["sed", "-i", "-E", "25i sed -i -E \"/enable-unsafe-cors/ s/= .*/= true/\" /root/.secretd/config/app.toml", "/root/bootstrap_init.sh"]
## fast block time
#RUN ["sed", "-i", "-E", "25i sed -i -E \"/timeout_(propose|prevote|precommit|commit)/s/[0-9]+m?s/900ms/\" /root/.secretd/config/config.toml", "/root/bootstrap_init.sh"]

ENTRYPOINT ["hermes", "start"]

#for debugging purposes
#ENTRYPOINT ["tail", "-f", "/dev/null"]
