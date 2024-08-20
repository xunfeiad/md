import { Connection, clusterApiUrl, PublicKey } from "@solana/web3.js";

const connection = new Connection(clusterApiUrl("devnet"));
const address = new PublicKey("AMSy4Ls18VveJkYYNNEoTvA1PNd5iqiC6WQQTK8JXRXv");
const balance = await connection.getBalance(address);

console.log(`The balance of the account at ${address} is ${balance} lamports`);
console.log(`✅ Finished!`);