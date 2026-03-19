import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// 🌐 DEVNET RPC (GRATIS)
const RPC = "https://api.devnet.solana.com";

// 🔍 CEK TRANSAKSI
async function verifyTransaction(signature) {
  const res = await fetch(RPC, {
    method: "POST",
    headers: {"Content-Type": "application/json"},
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "getTransaction",
      params: [signature, "json"]
    })
  });

  const data = await res.json();

  if (!data.result) return false;

  const tx = data.result;

  const instructions = tx.transaction.message.instructions;

  return instructions.some(i =>
    i.parsed &&
    i.parsed.info.destination === process.env.RECEIVER_WALLET
  );
}

// 🚀 API
export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { wallet, amount, signature } = req.body;

    // VALIDASI
    if (!wallet || wallet.length < 10) {
      return res.status(400).json({ error: "Wallet tidak valid" });
    }

    const allowed = [1,5,10,50,100];
    if (!allowed.includes(amount)) {
      return res.status(400).json({ error: "Amount tidak valid" });
    }

    if (!signature) {
      return res.status(400).json({ error: "No transaction" });
    }

    // 🔍 VERIFIKASI BLOCKCHAIN
    const valid = await verifyTransaction(signature);

    if (!valid) {
      return res.status(400).json({ error: "Transaksi tidak valid" });
    }

    // 💾 SIMPAN
    const { error } = await supabase.from("mints").insert([
      { wallet, amount, usd: amount }
    ]);

    if (error) throw error;

    return res.json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
