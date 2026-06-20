const fs = require("fs");
const path = require("path");

// Carregar .env.local manualmente
const envFile = fs.readFileSync(".env.local", "utf8");
for (const line of envFile.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) process.env[m[1].trim()] = m[2].trim();
}

const https = require("https");

// Foto de teste: JPEG 100x100 pixels (cabeça simples, gerada programaticamente)
// Usar uma foto de domínio público pequena via https
function downloadImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function main() {
  console.log("Baixando foto de teste...");
  // Foto pública pequena (avatar placeholder)
  const imgBuf = await downloadImage("https://i.pravatar.cc/200");
  const fotoBase64 = imgBuf.toString("base64");
  console.log(`Foto: ${imgBuf.length} bytes`);

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) { console.error("OPENAI_API_KEY não encontrada"); process.exit(1); }

  // Ler modelo
  const modeloBuf = fs.readFileSync(path.join("public", "modelo-figurinha.jpg"));
  console.log(`Modelo: ${modeloBuf.length} bytes`);

  // Usar fetch (Node 18+) para chamar OpenAI
  const FormData = (await import("formdata-node")).FormData;
  const { Blob } = await import("buffer");

  const form = new FormData();
  form.append("model", "gpt-image-2");
  form.append("prompt", `Create a collectible sports sticker card featuring a child.
The child should wear the Chile 2026 national team jersey (red jersey, La Roja).
Name: CARLOS TESTE
Info: 10-06-2015
Club: COLO-COLO
Make it look like a real printed collectible sticker card.`);
  form.append("size", "768x1152");
  form.append("image[0]", new Blob([imgBuf], { type: "image/jpeg" }), "foto.jpg");
  form.append("image[1]", new Blob([modeloBuf], { type: "image/jpeg" }), "modelo.jpg");

  console.log("Chamando OpenAI gpt-image-2...");
  const res = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
    body: form,
  });

  const data = await res.json();
  if (!res.ok) { console.error("OpenAI erro:", JSON.stringify(data)); process.exit(1); }

  const b64 = data.data?.[0]?.b64_json;
  if (!b64) { console.error("Sem imagem na resposta"); process.exit(1); }

  const outPath = "test-figurinha.png";
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  console.log(`\n✅ Figurinha gerada: ${outPath} (${Math.round(b64.length * 0.75 / 1024)} KB)`);
}

main().catch(e => { console.error(e); process.exit(1); });
