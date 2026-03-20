import { RPC, RECEIVER, PRICE } from "./config.js";

export async function verifyTx(signature, amount) {

  const res = await fetch(RPC, {
    method: "POST",
    headers: {"Content-Type":"application/json"},
    body: JSON.stringify({
      jsonrpc:"2.0",
      id:1,
      method:"getTransaction",
      params:[signature,"json"]
    })
  });

  const data = await res.json();

  if (!data.result) return { ok:false, error:"tx not found" };

  const tx = data.result;
  const instructions = tx.transaction.message.instructions;

  const transfer = instructions.find(i =>
    i.parsed &&
    i.parsed.type === "transfer" &&
    i.parsed.info.destination === RECEIVER
  );

  if (!transfer) return { ok:false, error:"wrong receiver" };

  const lamports = transfer.parsed.info.lamports;
  const expected = PRICE[amount];

  if (!expected) return { ok:false, error:"invalid amount" };

  if (lamports < expected) {
    return { ok:false, error:"not enough payment" };
  }

  return { ok:true };
}
