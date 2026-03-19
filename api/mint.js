import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

// 🧠 memory rate limit (simple)
let lastRequestMap = {};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Method not allowed" });
    }

    const ip = req.headers["x-forwarded-for"] || "unknown";

    // 🚫 RATE LIMIT (5 detik)
    if (lastRequestMap[ip] && Date.now() - lastRequestMap[ip] < 5000) {
      return res.status(429).json({ error: "Terlalu cepat, tunggu 5 detik" });
    }

    lastRequestMap[ip] = Date.now();

    const { wallet, amount } = req.body;

    // 🔐 VALIDASI WALLET
    if (!wallet || wallet.length < 10) {
      return res.status(400).json({ error: "Wallet tidak valid" });
    }

    // 🔐 VALIDASI AMOUNT
    const allowed = [1, 5, 10, 50, 100];
    if (!allowed.includes(amount)) {
      return res.status(400).json({ error: "Jumlah tidak valid" });
    }

    // 💰 SIMULASI PAYMENT CHECK (sementara)
    // nanti bisa diganti cek blockchain
    const paymentVerified = true;

    if (!paymentVerified) {
      return res.status(400).json({ error: "Pembayaran belum terdeteksi" });
    }

    // 📦 INSERT DATABASE
    const { error } = await supabase.from("mints").insert([
      {
        wallet,
        amount,
        usd: amount
      }
    ]);

    if (error) throw error;

    return res.json({ success: true });

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
