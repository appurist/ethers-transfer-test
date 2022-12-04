import { ethers } from "ethers";
import DESK_CONTRACT_ABI from "./DESK.json" assert { type: "json" };

import {config as dotConfig} from 'dotenv'
dotConfig()

function getConfigValue(key) {
    const value = process.env[key];
    if (value === undefined) {
        throw new Error(`Missing config value: ${key}`);
    }
    return value;
}

const PROVIDER_NETWORK = getConfigValue("PROVIDER_NETWORK");
const ALCHEMY_KEY = getConfigValue("ALCHEMY_KEY");

const DESK_CONTRACT_ADDRESS = getConfigValue("DESK_CONTRACT_ADDRESS");
const SIGNER_PRIVATE_KEY = getConfigValue("SIGNER_PRIVATE_KEY");
