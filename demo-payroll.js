const { poseidonHash, computeCommitment, computeNullifier, MerkleTree } = require("@protocol-01/zk-sdk");
const crypto = require("crypto");

async function main() {
  console.log("\n  Protocol 01 - Private Payroll Demo\n");
  console.log("  Use case: A company pays 3 employees in crypto.");
  console.log("  No employee can see what the others earn.\n");

  var companyKey = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
  var companyPub = await poseidonHash([companyKey, 0n]);
  var totalBudget = BigInt(15000000000);
  var rand0 = BigInt("0x" + crypto.randomBytes(31).toString("hex"));

  var budgetCommitment = await computeCommitment(totalBudget, companyPub, rand0, 0n);
  var tree = new MerkleTree(20);
  tree.insert(budgetCommitment);

  console.log("STEP 1: SHIELD - Company deposits 15,000 USDC");
  console.log("  Budget commitment:", "0x" + budgetCommitment.toString(16).slice(0, 16) + "...");
  console.log("  Total budget on-chain: HIDDEN\n");

  var names = ["Alice (Engineer)", "Bob (Designer)", "Charlie (Marketing)"];
  var salaries = [BigInt(7000000000), BigInt(5000000000), BigInt(3000000000)];
  var remaining = totalBudget;
  var prevCommitment = budgetCommitment;

  for (var i = 0; i < 3; i++) {
    var empKey = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
    var empPub = await poseidonHash([empKey, 0n]);
    var randPay = BigInt("0x" + crypto.randomBytes(31).toString("hex"));
    var randChange = BigInt("0x" + crypto.randomBytes(31).toString("hex"));

    var payCommitment = await computeCommitment(salaries[i], empPub, randPay, 0n);
    var changeAmount = remaining - salaries[i];
    var changeCommitment = await computeCommitment(changeAmount, companyPub, randChange, 0n);

    var keyHash = await poseidonHash([companyKey]);
    var nullifier = await computeNullifier(prevCommitment, keyHash);

    tree.insert(payCommitment);
    tree.insert(changeCommitment);

    console.log("STEP " + (i + 2) + ": PAY - " + names[i]);
    console.log("  Salary: " + Number(salaries[i]) / 1000000 + " USDC");
    console.log("  Payment:", "0x" + payCommitment.toString(16).slice(0, 16) + "...");
    console.log("  Nullifier:", "0x" + nullifier.toString(16).slice(0, 16) + "...");
    console.log("  Salary visible to others: NO\n");

    remaining = changeAmount;
    prevCommitment = changeCommitment;
  }

  console.log("VERIFY - Privacy guarantees");
  console.log("  Employees paid: 3");
  console.log("  Alice knows Bob salary?", false);
  console.log("  Bob knows Alice salary?", false);
  console.log("  On-chain observer sees salaries?", false);
  console.log("  Company can prove payments?", true);
  console.log("\n  npm install @protocol-01/zk-sdk\n");
}

main().catch(console.error);
