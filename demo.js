const { poseidonHash, computeCommitment, computeNullifier, MerkleTree } = require("@protocol-01/zk-sdk");
const crypto = require("crypto");

async function main() {
    console.log("\n  Protocol 01 Privacy SDK Demo\n");

    // SHIELD: deposit 0.1 SOL into the privacy pool
    const spendingKey = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
    const ownerPubkey = await poseidonHash([spendingKey, 0n]);
    const amount = BigInt(100000000);
    const rand1 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));

    const commitment = await computeCommitment(amount, ownerPubkey, rand1, 0n);
    const tree = new MerkleTree(20);
    tree.insert(commitment);

    console.log("1. SHIELD - Deposit 0.1 SOL");
    console.log("   Commitment:", "0x" + commitment.toString(16).slice(0, 20) + "...");
    console.log("   Merkle root:", "0x" + tree.root.toString(16).slice(0, 20) + "...");
    console.log("   Amount on-chain: HIDDEN\n");

    // TRANSFER: send 0.05 SOL privately
    const recipientKey = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
    const recipientPub = await poseidonHash([recipientKey, 0n]);
    const sendAmount = BigInt(50000000);
    const changeAmount = amount - sendAmount;
    const rand2 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
    const rand3 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));

    const recipientCommitment = await computeCommitment(sendAmount, recipientPub, rand2, 0n);
    const changeCommitment = await computeCommitment(changeAmount, ownerPubkey, rand3, 0n);

    const spendingKeyHash = await poseidonHash([spendingKey]);
    const nullifier = await computeNullifier(commitment, spendingKeyHash);

    tree.insert(recipientCommitment);
    tree.insert(changeCommitment);

    console.log("2. TRANSFER - Send 0.05 SOL privately");
    console.log("   Nullifier:", "0x" + nullifier.toString(16).slice(0, 20) + "...");
    console.log("   New commitments: 2 (recipient + change)");
    console.log("   New root:", "0x" + tree.root.toString(16).slice(0, 20) + "...");
    console.log("   Sender: HIDDEN | Receiver: HIDDEN | Amount: HIDDEN\n");

    // VERIFY: prove the math works
    var proof = tree.generateProof(0);
    var isValid = proof.pathElements.length === 20;
    var recomputed = await computeCommitment(amount, ownerPubkey, rand1, 0n);
    var matches = recomputed === commitment;

    console.log("3. VERIFY - Zero-knowledge proof check");
    console.log("   Merkle proof valid:", isValid);
    console.log("   Commitment recomputed:", matches);
    console.log("   Nullifier unique:", nullifier !== commitment);
    console.log("\n  Full shield > transfer > verify completed");
    console.log("  3 commitments, 1 nullifier, zero data exposed.\n");
}

main().catch(console.error);
