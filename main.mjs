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
const amount = ethers.utils.parseEther(getConfigValue("AMOUNT") || "1");
const deskAmount = ethers.utils.formatEther(amount);

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

console.log(`Sending ${amount} (${deskAmount} DESK) to ${receiver}`);

try {
  // construct transaction
  const desk = await contract.connect(signer);
  const txnProps = {
    gasLimit: 100000,
    gasPrice: 2000000000,
  };
  const draftTxn = await desk.populateTransaction.transfer(receiver, amount, txnProps);
  console.log("Draft transaction: ",draftTxn);
  console.log("gasLimit: ",draftTxn.gasLimit);
  console.log("gasPrice (gwei): ",ethers.utils.formatUnits(draftTxn.gasPrice, "gwei"));
  // gas estimate
  const estimate = await desk.estimateGas.transfer(receiver, amount, txnProps);
  console.log(`Estimate: ${estimate} GAS`);
  // dry-run
  console.log('Attempting dry-run.');
  const dryRun = await desk.callStatic.transfer(receiver, amount, txnProps);
  console.log(dryRun);
  // transfer
  console.log(`Sending ${amount} DESK (${amount} wei) from ${signer.address} to ${receiver}...`);
  const receipt = await desk.transfer(receiver, amount, txnProps);
  if (!receipt) {
    console.log(`Transfer of ${amount} (${deskAmount} DESK) to ${receiver}, NO RECEIPT!`);
    throw new Error(`claimReward: Transfer of ${amount} (${deskAmount} DESK) to ${receiver}: could not generate receipt.`);
  }
  console.log(`Sent ${amount} (${deskAmount} DESK) from ${signer.address} to ${receiver}.`);
  try {
    console.log(JSON.stringify(receipt, null, 2));
    console.log(`Transfer of ${amount} (${deskAmount} DESK), receipt OK: ${receipt.hash}`);
  } catch (e) {
    console.log(e.message);
  }
} catch (err) {
  let message = err?.error?.error?.message || err?.error?.reason || err?.reason || "";
  console.log(`Error sending ${amount} (${deskAmount} DESK) to ${receiver}:`, message);
  if (err?.message) {
    console.log(err.message);
  }
}
