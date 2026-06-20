const fs = require("fs");
const env = fs.readFileSync(".env.vercel.prod", "utf8");
const line = env.split("\n").find(l => l.startsWith("OPENAI_API_KEY"));
console.log("linha raw:", JSON.stringify(line ? line.slice(0, 40) : "NAO ENCONTRADA"));
if (line) {
  const val = line.split("=").slice(1).join("=").replace(/^["']|["']\r?$/g, "").trim();
  console.log("valor length:", val.length, "| primeiros 4 chars:", val.slice(0, 4));
}
