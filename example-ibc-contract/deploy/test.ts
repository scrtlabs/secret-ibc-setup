import { sha256 } from "@noble/hashes/sha256";
import { execSync } from "child_process";
import * as fs from "fs";
import {
  fromBase64,
  fromUtf8,
  MsgExecuteContract,
  ProposalType,
  SecretNetworkClient,
  toBase64,
  toHex,
  toUtf8,
  Tx,
  TxResultCode,
  Wallet,
} from "secretjs";
import {
  QueryBalanceRequest,
  QueryBalanceResponse,
} from "secretjs/dist/protobuf_stuff/cosmos/bank/v1beta1/query";
import { MsgSend } from "secretjs/dist/protobuf_stuff/cosmos/bank/v1beta1/tx";
import { AminoWallet } from "secretjs/dist/wallet_amino";
import {
  ibcDenom,
  sleep,
  storeContracts,
  waitForBlocks,
  waitForIBCChannel,
  waitForIBCConnection,
  Contract,
  instantiateContracts,
  cleanBytes,
} from "./utils";

type Account = {
  address: string;
  mnemonic: string;
  walletAmino: AminoWallet;
  walletProto: Wallet;
  secretjs: SecretNetworkClient;
};

// @ts-ignore
// accounts on secretdev-1
const accounts: Account[] = new Array(accountsCount);
const accounts2: Account[] = new Array(3);
let readonly: SecretNetworkClient;
let readonly2: SecretNetworkClient;

let wasmCode: Uint8Array;
const contracts = {
  "secretdev-1": new Contract,
  "secretdev-2": new Contract,
};

const populateAccounts = async (mnemonics, chainId, endpoint) => {
  for (let i = 0; i < mnemonics.length; i++) {
    const mnemonic = mnemonics[i];
    const walletAmino = new AminoWallet(mnemonic);
    accounts[i] = {
      address: walletAmino.address,
      mnemonic: mnemonic,
      walletAmino,
      walletProto: new Wallet(mnemonic),
      secretjs: await SecretNetworkClient.create({
        grpcWebUrl: endpoint,
        wallet: walletAmino,
        walletAddress: walletAmino.address,
        chainId,
      }),
    };
  }
}

beforeAll(async () => {
  const mnemonics = [
    "grant rice replace explain federal release fix clever romance raise often wild taxi quarter soccer fiber love must tape steak together observe swap guitar",
    "jelly shadow frog dirt dragon use armed praise universe win jungle close inmate rain oil canvas beauty pioneer chef soccer icon dizzy thunder meadow",
  ];

  await Promise.all([
    // Create clients for existing wallets in the chains
    populateAccounts(mnemonics, "secretdev-1", "http://localhost:9091"),
    populateAccounts(mnemonics, "secretdev-2", "http://localhost:9391"),

    // Create readonly clients
    SecretNetworkClient.create({chainId: "secretdev-1", grpcWebUrl: "http://localhost:9091"}).then(result => readonly = result),
    SecretNetworkClient.create({chainId: "secretdev-2", grpcWebUrl: "http://localhost:9391"}).then(result => readonly2 = result),

    // Wait for the chains to be running
    waitForBlocks("secretdev-1"),
    waitForBlocks("secretdev-2"),
  ]);

  wasmCode = fs.readFileSync(`${__dirname}/../ibc.wasm`) as Uint8Array;
  contracts["secretdev-1"].codeHash = toHex(sha256(wasmCode));
  contracts["secretdev-2"].codeHash = toHex(sha256(wasmCode));

  console.log("Storing contracts on secretdev-1...");
  let tx: Tx = await storeContracts(accounts[0].secretjs, [wasmCode);
  expect(tx.code).toBe(TxResultCode.Success);

  contracts["secretdev-1"].codeId = Number(tx.arrayLog.find((x) => x.key === "code_id").value);

  console.log("Instantiating contracts on secretdev-1...");
  tx = await instantiateContracts(accounts[0].secretjs, [contracts["secretdev-1"]]);
  expect(tx.code).toBe(TxResultCode.Success);

  contracts["secretdev-1"].address = tx.arrayLog.find((x) => x.key === "contract_address").value;
  contracts["secretdev-1"].ibcPortId = "wasm." + contracts["secretdev-1"].address;

  console.log("Storing contracts on secretdev-2...");
  tx = await storeContracts(accounts2[0].secretjs, [wasmCode);
  expect(tx.code).toBe(TxResultCode.Success);

  contracts["secretdev-2"].codeId = Number(tx.arrayLog.find((x) => x.key === "code_id").value);

  console.log("Instantiating contracts on secretdev-2...");
  tx = await instantiateContracts(accounts2[0].secretjs, [contracts["secretdev-2"]]);
  expect(tx.code).toBe(TxResultCode.Success);

  contracts["secretdev-2"].address = tx.arrayLog.find((x) => x.key === "contract_address").value;
  contracts["secretdev-2"].ibcPortId = "wasm." + contracts["secretdev-2"].address;
});

describe("IBC", () => {
  beforeAll(async () => {
    await waitForIBCConnection("secretdev-1", "http://localhost:9091");
    await waitForIBCConnection("secretdev-2", "http://localhost:9391");

    await waitForIBCChannel(
      "secretdev-1",
      "http://localhost:9091",
      "channel-0"
    );
    await waitForIBCChannel(
      "secretdev-2",
      "http://localhost:9391",
      "channel-0"
    );
  }, 180_000 /* 3 minutes */);

  test("transfer sanity", async () => {
    const denom = ibcDenom(
      [
        {
          portId: "transfer",
          channelId: "channel-0",
        },
      ],
      "uscrt"
    );
    const { balance: balanceBefore } = await readonly2.query.bank.balance({
      address: accounts2[0].address,
      denom,
    });
    const amountBefore = Number(balanceBefore?.amount ?? "0");

    const result = await accounts[0].secretjs.tx.ibc.transfer({
      receiver: accounts[0].address,
      sender: accounts[0].address,
      sourceChannel: "channel-0",
      sourcePort: "transfer",
      token: {
        denom: "uscrt",
        amount: "1",
      },
      timeoutTimestampSec: String(Math.floor(Date.now() / 1000 + 30)),
    });

    if (result.code !== 0) {
      console.error(result.rawLog);
    }

    expect(result.code).toBe(TxResultCode.Success);

    // checking ack/timeout on secretdev-1 might be cleaner
    while (true) {
      try {
        const { balance: balanceAfter } = await readonly2.query.bank.balance({
          address: accounts2[0].address,
          denom,
        });
        const amountAfter = Number(balanceAfter?.amount ?? "0");

        if (amountAfter === amountBefore + 1) {
          break;
        }
      } catch (e) {
        // console.error("ibc denom balance error:", e);
      }
      await sleep(200);
    }
    expect(true).toBe(true);
  }, 30_000 /* 30 seconds */);

  test("contracts sanity", async () => {
    const command =
      "docker exec ibc-relayer-1 hermes " +
      "--config /home/hermes-user/.hermes/alternative-config.toml " +
      "create channel " +
      "--a-chain secretdev-1 " +
      `--a-port ${contracts["secretdev-1"].v1.ibcPortId} ` +
      `--b-port ${contracts["secretdev-2"].v1.ibcPortId} ` +
      "--a-connection connection-0";

    console.log("calling relayer with command:", command);
    const result = execSync(command);

    const trimmedResult = result.toString().replace(/\s/g, "");

    const myRegexp = /ChannelId\("(channel-\d+)"/g;
    const channelId = myRegexp.exec(trimmedResult)[1];

    await waitForIBCChannel("secretdev-1", "http://localhost:9091", channelId);

    await waitForIBCChannel("secretdev-2", "http://localhost:9391", channelId);

    const tx = await accounts[0].secretjs.tx.compute.executeContract(
      {
        sender: accounts[0].address,
        contractAddress: contracts["secretdev-1"].v1.address,
        codeHash: contracts["secretdev-1"].v1.codeHash,
        msg: {
          send_ibc_packet: {
            message: "hello from test",
          },
        },
      },
      { gasLimit: 250_000 }
    );
    console.log("tx", tx);
    if (tx.code !== TxResultCode.Success) {
      console.error(tx.rawLog);
    }
    expect(tx.code).toBe(TxResultCode.Success);
    console.log(
      "tx after triggering ibc send endpoint",
      JSON.stringify(cleanBytes(tx), null, 2)
    );

    expect(tx.arrayLog.find((x) => x.key === "packet_data").value).toBe(
      `{"message":{"value":"${channelId}hello from test"}}`
    );

    const packetSendCommand =
      "docker exec ibc-relayer-1 hermes " +
      "--config /home/hermes-user/.hermes/alternative-config.toml " +
      "tx packet-recv --dst-chain secretdev-2 --src-chain secretdev-1 " +
      `--src-port ${contracts["secretdev-1"].v1.ibcPortId} ` +
      `--src-channel ${channelId}`;

    console.log(
      "calling docker exec on relayer with command",
      packetSendCommand
    );
    let packetSendResult = execSync(packetSendCommand);
    console.log(
      "finished executing command, result:",
      packetSendResult.toString()
    );

    const packetAckCommand =
      "docker exec ibc-relayer-1 hermes " +
      "--config /home/hermes-user/.hermes/alternative-config.toml " +
      "tx packet-ack --dst-chain secretdev-1 --src-chain secretdev-2 " +
      `--src-port ${contracts["secretdev-1"].v1.ibcPortId} ` +
      `--src-channel ${channelId}`;

    console.log(
      "calling docker exec on relayer with command",
      packetAckCommand
    );
    const packetAckResult = execSync(packetAckCommand);
    console.log(
      "finished executing command, result:",
      packetAckResult.toString()
    );

    let queryResult: any =
      await accounts[0].secretjs.query.compute.queryContract({
        contractAddress: contracts["secretdev-1"].v1.address,
        codeHash: contracts["secretdev-1"].v1.codeHash,
        query: {
          last_ibc_ack: {},
        },
      });

    const ack = fromUtf8(fromBase64(queryResult));

    expect(ack).toBe(`recv${channelId}hello from test`);

    queryResult = await accounts2[0].secretjs.query.compute.queryContract({
      contractAddress: contracts["secretdev-2"].v1.address,
      codeHash: contracts["secretdev-2"].v1.codeHash,
      query: {
        last_ibc_ack: {},
      },
    });

    expect(queryResult).toBe(`no ack yet`);

    queryResult = await accounts[0].secretjs.query.compute.queryContract({
      contractAddress: contracts["secretdev-1"].v1.address,
      codeHash: contracts["secretdev-1"].v1.codeHash,
      query: {
        last_ibc_receive: {},
      },
    });

    expect(queryResult).toBe(`no receive yet`);

    queryResult = await accounts2[0].secretjs.query.compute.queryContract({
      contractAddress: contracts["secretdev-2"].v1.address,
      codeHash: contracts["secretdev-2"].v1.codeHash,
      query: {
        last_ibc_receive: {},
      },
    });

    expect(queryResult).toBe(`${channelId}hello from test`);
  }, 80_000 /* 80 seconds */);
});