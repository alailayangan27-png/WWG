import { createClient } from "@supabase/supabase-js";
import { verifyTx } from "../lib/verifyTx.js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY
);

export default async function handler(req, res){

  try{

    if(req.method !== "POST"){
      return res.status(405).json({ error:"method not allowed" });
    }

    const { wallet, amount, signature } = req.body;

    if(!wallet || !amount || !signature){
      return res.status(400).json({ error:"data tidak lengkap" });
    }

    // 🔒 anti double claim
    const { data:existing } = await supabase
      .from("mints")
      .select("*")
      .eq("signature", signature)
      .single();

    if(existing){
      return res.status(400).json({ error:"sudah digunakan" });
    }

    // 🔍 verify blockchain
    const check = await verifyTx(signature, amount);

    if(!check.ok){
      return res.status(400).json({ error:check.error });
    }

    // 💾 simpan
    await supabase.from("mints").insert([
      { wallet, amount, signature }
    ]);

    return res.json({ success:true });

  }catch(err){
    return res.status(500).json({ error:err.message });
  }
}
