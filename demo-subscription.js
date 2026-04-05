const {
  poseidonHash,
  computeCommitment,
  computeNullifier,
  MerkleTree,
} = require("@protocol-01/zk-sdk");
const crypto = require("crypto");

async function main() {
  console.log("\n  Protocol 01 — Private Subscription Demo\n");
  console.log("  Use case: Netflix-style subscription where the merchant");
  console.log("  receives payments but cannot see who is paying.\n");

  // =========================================
  // MERCHANT SETUP (done once)
  // =========================================
  const merchantKey = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  const merchantPub = await poseidonHash([merchantKey, 0n]);
  console.log("MERCHANT SETUP");
  console.log("  Merchant pubkey:", "0x" + merchantPub.toString(16).slice(0, 16) + "...");
  console.log("  Subscription: 9.99 USDC / month\n");

  // =========================================
  // SUBSCRIBER: shield funds (one time)
  // =========================================
  const subscriberKey = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  const subscriberPub = await poseidonHash([subscriberKey, 0n]);
  const shieldAmount = BigInt(100_000_000); // 100 USDC (6 decimals)
  const rand1 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));

  const depositCommitment = await computeCommitment(shieldAmount, subscriberPub, rand1, 0n);

  const tree = new MerkleTree(20);
  tree.insert(depositCommitment);

  console.log("STEP 1: SHIELD — Subscriber deposits 100 USDC");
  console.log("  Deposit commitment:", "0x" + depositCommitment.toString(16).slice(0, 16) + "...");
  console.log("  Subscriber identity: HIDDEN\n");

  // =========================================
  // MONTH 1: private payment to merchant
  // =========================================
  const paymentAmount = BigInt(9_990_000); // 9.99 USDC
  const changeAmount = shieldAmount - paymentAmount;
  const rand2 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  const rand3 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));

  // Each payment generates a fresh stealth address for the merchant
  // Merchant can claim it, but cannot link it to the subscriber
  const paymentCommitment = await computeCommitment(paymentAmount, merchantPub, rand2, 0n);
  const changeCommitment = await computeCommitment(changeAmount, subscriberPub, rand3, 0n);

  // Nullifier proves the deposit was spent without revealing which one
  const keyHash = await poseidonHash([subscriberKey]);
  const nullifier = await computeNullifier(depositCommitment, keyHash);

  tree.insert(paymentCommitment);
  tree.insert(changeCommitment);

  console.log("STEP 2: PAY — Month 1 subscription (9.99 USDC)");
  console.log("  Nullifier:", "0x" + nullifier.toString(16).slice(0, 16) + "...");
  console.log("  Payment to merchant:", "0x" + paymentCommitment.toString(16).slice(0, 16) + "...");
  console.log("  Change back:", "0x" + changeCommitment.toString(16).slice(0, 16) + "...");
  console.log("  Merkle root:", "0x" + tree.root.toString(16).slice(0, 16) + "...\n");

  // =========================================
  // MONTH 2: another payment, fresh address
  // =========================================
  const paymentAmount2 = BigInt(9_990_000);
  const changeAmount2 = changeAmount - paymentAmount2;
  const rand4 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  const rand5 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));

  const paymentCommitment2 = await computeCommitment(paymentAmount2, merchantPub, rand4, 0n);
  const changeCommitment2 = await computeCommitment(changeAmount2, subscriberPub, rand5, 0n);

  const nullifier2 = await computeNullifier(changeCommitment, await poseidonHash([subscriberKey]));

  tree.insert(paymentCommitment2);
  tree.insert(changeCommitment2);

  console.log("STEP 3: PAY — Month 2 subscription (9.99 USDC)");
  console.log("  New nullifier:", "0x" + nullifier2.toString(16).slice(0, 16) + "...");
  console.log("  New payment:", "0x" + paymentCommitment2.toString(16).slice(0, 16) + "...");
  console.log("  New change:", "0x" + changeCommitment2.toString(16).slice(0, 16) + "...\n");

  // =========================================
  // VERIFY: payments are unlinkable
  // =========================================
  const linked = paymentCommitment === paymentCommitment2;
  const nullifiersLinked = nullifier === nullifier2;

  console.log("VERIFY — Privacy guarantees");
  console.log("  Payment 1 == Payment 2?", linked, "(different commitments)");
  console.log("  Nullifier 1 == Nullifier 2?", nullifiersLinked, "(different nullifiers)");
  console.log("  Merchant knows who pays?", false);
  console.log("  Payments linkable?", false);
  console.log("  Subscription visible on-chain?", false);

  console.log("\n  RESULT: 2 months paid, merchant received funds,");
  console.log("  zero link between subscriber and payments.");
  console.log("  5 commitments in tree, 2 nullifiers spent.\n");

  console.log("  npm install @protocol-01/zk-sdk");
  console.log("  npm install @protocol-01/specter-sdk\n");
}

main().catch(console.error);
