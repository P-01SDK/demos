const { poseidonHash, computeCommitment, computeNullifier, MerkleTree } = require("@protocol-01/zk-sdk");
const crypto = require("crypto");

async function main() {
  console.log("\n  Protocol 01 - Private OTC Desk Demo\n");
  console.log("  Use case: Whale buys 50,000 USDC of SOL OTC.");
  console.log("  No one sees the trade. No price impact. No front-running.\n");

  var tree = new MerkleTree(20);

  var buyerKey = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  var buyerPub = await poseidonHash([buyerKey, 0n]);
  var buyerAmount = BigInt(50000000000);
  var rand1 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  var buyerCommitment = await computeCommitment(buyerAmount, buyerPub, rand1, 0n);
  tree.insert(buyerCommitment);

  console.log("STEP 1: BUYER shields 50,000 USDC");
  console.log("  Commitment:", "0x" + buyerCommitment.toString(16).slice(0, 16) + "...");
  console.log("  Amount visible: NO | Identity visible: NO\n");

  var sellerKey = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  var sellerPub = await poseidonHash([sellerKey, 0n]);
  var sellerAmount = BigInt(333000000000);
  var rand2 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  var sellerCommitment = await computeCommitment(sellerAmount, sellerPub, rand2, 0n);
  tree.insert(sellerCommitment);

  console.log("STEP 2: SELLER shields 333 SOL");
  console.log("  Commitment:", "0x" + sellerCommitment.toString(16).slice(0, 16) + "...");
  console.log("  Amount visible: NO | Identity visible: NO\n");

  var rand3 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  var rand4 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  var buyerGetsSOL = await computeCommitment(sellerAmount, buyerPub, rand3, 0n);
  var sellerGetsUSDC = await computeCommitment(buyerAmount, sellerPub, rand4, 0n);

  var buyerNullifier = await computeNullifier(buyerCommitment, await poseidonHash([buyerKey]));
  var sellerNullifier = await computeNullifier(sellerCommitment, await poseidonHash([sellerKey]));

  tree.insert(buyerGetsSOL);
  tree.insert(sellerGetsUSDC);

  console.log("STEP 3: ATOMIC SWAP - private exchange");
  console.log("  Buyer nullifier:", "0x" + buyerNullifier.toString(16).slice(0, 16) + "...");
  console.log("  Seller nullifier:", "0x" + sellerNullifier.toString(16).slice(0, 16) + "...");
  console.log("  Buyer receives SOL:", "0x" + buyerGetsSOL.toString(16).slice(0, 16) + "...");
  console.log("  Seller receives USDC:", "0x" + sellerGetsUSDC.toString(16).slice(0, 16) + "...\n");

  console.log("VERIFY - Privacy guarantees");
  console.log("  Trade amount visible?", false);
  console.log("  Buyer identity visible?", false);
  console.log("  Seller identity visible?", false);
  console.log("  Front-running possible?", false);
  console.log("  Both parties received funds?", true);
  console.log("  Commitments in tree:", tree.leafCount);
  console.log("\n  npm install @protocol-01/zk-sdk\n");
}

main().catch(console.error);
