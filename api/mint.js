import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const { wallet, amount } = req.body;

    // ✅ VALIDASI
    if (!wallet || wallet.length < 10) {
      return res.status(400).json({ error: "Wallet tidak valid" });
    }

    const allowed = [1, 5, 10, 50, 100];
    if (!allowed.includes(amount)) {
      return res.status(400).json({ error: "Amount tidak valid" });
    }

    // ✅ RATE LIMIT SIMPLE (per request)
    // (bisa ditingkatkan nanti)

    // ✅ INSERT KE DATABASE
    const { error } = await supabase.from("mints").insert([
      {
        wallet,
        amount,
        usd: amount
      }
    ]);

    if (error) throw error;

    return res.status(200).json({
      success: true,
      message: "Mint berhasil"
    });

  } catch (err) {
    return res.status(500).json({
      error: err.message
    });
  }
}
