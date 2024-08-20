import {Keypair} from "@solana/web3.js"

const keypair = Keypair.generate();

console.log(`The public key is: `, keypair.publicKey.toBase58());
// 不要在源码上显示 `secretKey`.
// 放入 `.env`文件
console.log(`The secret key is: `, keypair.secretKey);
console.log(`✅ Finished!`);
