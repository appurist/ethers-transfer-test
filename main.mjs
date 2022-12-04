import { ethers } from "ethers";
import DESK_CONTRACT_ABI from "./DESK.json" assert { type: "json" };
import {config as dotConfig} from 'dotenv'
dotConfig()

const PROVIDER_NETWORK = getConfigValue("PROVIDER_NETWORK");
const ALCHEMY_KEY = getConfigValue("ALCHEMY_KEY");

const DESK_CONTRACT_ADDRESS = getConfigValue("DESK_CONTRACT_ADDRESS");
const SIGNER_PRIVATE_KEY = getConfigValue("SIGNER_PRIVATE_KEY");

function getConfigValue(key) {
  return process.env[key];
}
const receiver = getConfigValue("RECEIVER_ADDRESS") || "0x83Ac670f03bAe84e7A0275C32f1B75F59aCDa879";
const amountWei = ethers.utils.parseEther(getConfigValue("AMOUNT") || "1");
const amountDesk = ethers.utils.formatEther(amountWei);

let provider;
let signer;
let contract;
try {
  provider = new ethers.providers.AlchemyProvider(PROVIDER_NETWORK, ALCHEMY_KEY);
  signer = new ethers.Wallet(SIGNER_PRIVATE_KEY, provider);
  contract = new ethers.Contract(DESK_CONTRACT_ADDRESS, DESK_CONTRACT_ABI, signer);
} catch (err) {
  let message = err?.error?.error?.message || err?.error?.reason || err?.reason || err?.message;
  console.log(`Cannot initalize contract with ${DESK_CONTRACT_ADDRESS} on ${PROVIDER_NETWORK}:`, message);
  process.exit(1);
}

console.log(`Sending ${amountWei} (${amountDesk} DESK) to ${receiver}`);

try {
  // construct transaction
  const desk = await contract.connect(signer);
  const txnProps = {
    gasLimit: 100000,
    gasPrice: 100000000000, //ethers.utils.parseUnits("100", "gwei"),
  };
  const draftTxn = await desk.populateTransaction.transfer(receiver, amountWei, txnProps);
  console.log("Draft transaction:",draftTxn);
  console.log("gasLimit: ",draftTxn.gasLimit.toString());
  console.log(`gasPrice: ${ethers.utils.formatUnits(draftTxn.gasPrice, "gwei")} gwei`);
  // gas estimate
  const estimate = await desk.estimateGas.transfer(receiver, amountWei, txnProps);
  console.log(`Estimate: ${estimate} GAS`);
  // dry-run
  console.log('Attempting dry-run.');
  const dryRun = await desk.callStatic.transfer(receiver, amountWei, txnProps);
  console.log("Dry run complete:", dryRun);
  // transfer
  console.log(`Sending ${amountWei} wei (${amountDesk} DESK) from ${signer.address} to ${receiver}...`);
  const receipt = await desk.transfer(receiver, amountWei, txnProps);
  if (!receipt) {
    console.log(`Transfer of ${amountWei} (${amountDesk} DESK) to ${receiver}, NO RECEIPT!`);
    throw new Error(`claimReward: Transfer of ${amountWei} (${amountDesk} DESK) to ${receiver}: could not generate receipt.`);
  }
  console.log(`Sent ${amountWei} (${amountDesk} DESK) from ${signer.address} to ${receiver}.`);
  try {
    console.log(JSON.stringify(receipt, null, 2));
    console.log(`Transfer of ${amountWei} (${amountDesk} DESK), receipt OK: ${receipt.hash}`);
  } catch (e) {
    console.log(e.message);
  }
} catch (err) {
  let message = err?.error?.error?.message || err?.error?.reason || err?.reason || "";
  console.log(`Error sending ${amountWei} (${amountDesk} DESK) to ${receiver}:`, message);
  if (err?.message) {
    console.log(err.message);
  }
}
