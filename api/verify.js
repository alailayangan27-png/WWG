import { createClient } from "@supabase/supabase-js";
import { verifyTx } from "../lib/verifyTx.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {

  try {

    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { wallet, amount, signature } = req.body;

    if (!wallet || !amount || !signature) {
      return res.status(400).json({ error: "Data tidak lengkap" });
    }

    // 🔒 CEK DOUBLE CLAIM
    const { data: existing } = await supabase
      .from("mints")
      .select("*")
      .eq("signature", signature)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Sudah digunakan" });
    }

    // 🔍 CEK BLOCKCHAIN
    const result = await verifyTx(signature, amount);

    if (!result.ok) {
      return res.status(400).json({ error: result.reason });
    }

    // 💾 SIMPAN
    await supabase.from("mints").insert([
      { wallet, amount, signature }
    ]);

    return res.json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
                                   }
