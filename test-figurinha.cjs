const fs = require("fs");
const path = require("path");
const https = require("https");

// Carregar .env.local
const envFile = fs.readFileSync(".env.vercel.prod", "utf8");
for (const line of envFile.split("\n")) {
  if (!line.trim() || line.startsWith("#")) continue;
  const eqIdx = line.indexOf("=");
  if (eqIdx < 0) continue;
  const key = line.slice(0, eqIdx).trim();
  const raw = line.slice(eqIdx + 1).replace(/\r$/, "");
  const val = raw.replace(/^["']|["']$/g, "");
  if (key) process.env[key] = val;
}

function downloadImage(url) {
  return new Promise((resolve, reject) => {
    function get(u) {
      https.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          return get(res.headers.location);
        }
        const chunks = [];
        res.on("data", c => chunks.push(c));
        res.on("end", () => resolve(Buffer.concat(chunks)));
        res.on("error", reject);
      }).on("error", reject);
    }
    get(url);
  });
}

async function main() {
  console.log("Baixando foto de teste...");
  const imgBuf = await downloadImage("https://i.pravatar.cc/200");
  console.log(`Foto: ${imgBuf.length} bytes`);

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) { console.error("OPENAI_API_KEY não encontrada"); process.exit(1); }

  const modeloBuf = fs.readFileSync(path.join("public", "modelo-figurinha.jpg"));
  console.log(`Modelo: ${modeloBuf.length} bytes`);

  // Montar multipart/form-data manualmente
  const boundary = "----FormBoundary" + Math.random().toString(36).slice(2);

  function fieldPart(name, value) {
    return Buffer.from(
      `--${boundary}\r\nContent-Disposition: form-data; name="${name}"\r\n\r\n${value}\r\n`
    );
  }
  function filePart(name, filename, contentType, data) {
    return Buffer.concat([
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="${name}"; filename="${filename}"\r\nContent-Type: ${contentType}\r\n\r\n`),
      data,
      Buffer.from("\r\n"),
    ]);
  }

  const prompt = `You are given two images:
- Image 1: A photograph of a person (the SUBJECT).
- Image 2: A collectible sports sticker card (the TEMPLATE).

TASK: Create a new version of the sticker card (Image 2) featuring the person from Image 1.

INSTRUCTIONS:
1. REMOVE the athlete from Image 2 entirely.
2. GENERATE a medium close-up portrait of the person from Image 1 wearing the Chile 2026 national team jersey (red jersey, La Roja).
3. The person's FACE must be identical to Image 1.
4. Place this portrait into the card, centered in the same area.
5. Keep ALL other elements of Image 2 exactly as they are.
6. Update the text fields:
[NAME]: CARLOS TESTE
[INFO]: 10-06-2015
[CLUB]: COLO-COLO

The result must look like a real printed collectible sticker card.`;

  const body = Buffer.concat([
    fieldPart("model", "gpt-image-2"),
    fieldPart("prompt", prompt),
    fieldPart("size", "768x1152"),
    filePart("image[0]", "foto.jpg", "image/jpeg", imgBuf),
    filePart("image[1]", "modelo.jpg", "image/jpeg", modeloBuf),
    Buffer.from(`--${boundary}--\r\n`),
  ]);

  console.log("Chamando OpenAI gpt-image-2... (pode levar ~30-60s)");

  const result = await new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.openai.com",
      path: "/v1/images/edits",
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
      timeout: 240000,
    }, (res) => {
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve({ status: res.statusCode, body: Buffer.concat(chunks).toString() }));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });

  console.log(`OpenAI status: ${result.status}`);
  const data = JSON.parse(result.body);

  if (result.status !== 200) {
    console.error("Erro OpenAI:", JSON.stringify(data, null, 2));
    process.exit(1);
  }

  const b64 = data.data?.[0]?.b64_json;
  if (!b64) { console.error("Sem imagem na resposta:", JSON.stringify(data)); process.exit(1); }

  const outPath = "test-figurinha.png";
  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  const sizeKB = Math.round(b64.length * 0.75 / 1024);
  console.log(`\n✅ Figurinha gerada: ${outPath} (${sizeKB} KB)`);
  console.log(`   Abra o arquivo para ver o resultado.`);
}

main().catch(e => { console.error("ERRO:", e.message || e); process.exit(1); });
