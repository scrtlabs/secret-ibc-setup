# Build with:
# docker build -f hermes.Dockerfile . -t hermes:latest
# FROM golang:latest
FROM ubuntu:latest

# install rust  
#RUN ["curl", "--proto", "'=https'", "--tlsv1.2", "-sSf", "https://sh.rustup.rs", "|", "sh"]

# add hermes user
RUN ["useradd", "-ms", "/bin/bash", "hermes-user"]
USER hermes-user 
WORKDIR /home/hermes-user

# install hermes
ADD ["./hermes-v1.0.0-rc.2-x86_64-unknown-linux-gnu.tar.gz", "/hermes-installation"]
ENV PATH="${PATH}:/hermes-installation"

# configure hermes
COPY --chown=hermes-user ["./hermes-config.toml", "/home/hermes-user/.hermes/config.toml"]

# add keys on both chains
COPY ["./50s03.mnemonic", "/home/hermes-user/50s03.mnemonic"]
RUN ["hermes", "keys", "add", "--hd-path", "m/44'/529'/0'/0/0", "--mnemonic-file", "/home/hermes-user/50s03.mnemonic", "--chain", "secretdev-1"]
RUN ["hermes", "keys", "add", "--hd-path", "m/44'/529'/0'/0/0", "--mnemonic-file", "/home/hermes-user/50s03.mnemonic", "--chain", "secretdev-2"]

## enable unsafe cors in the configuration file:
#RUN ["sed", "-i", "-E", "25i sed -i -E \"/enable-unsafe-cors/ s/= .*/= true/\" /root/.secretd/config/app.toml", "/root/bootstrap_init.sh"]
## fast block time
#RUN ["sed", "-i", "-E", "25i sed -i -E \"/timeout_(propose|prevote|precommit|commit)/s/[0-9]+m?s/900ms/\" /root/.secretd/config/config.toml", "/root/bootstrap_init.sh"]

#ENTRYPOINT ["hermes", "start"]

#for debugging purposes
ENTRYPOINT ["tail", "-f", "/dev/null"]
