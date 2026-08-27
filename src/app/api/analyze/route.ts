import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY belum dikonfigurasi di server." },
      { status: 500 }
    );
  }

  try {
    const { base64Image, mimeType, extractMode } = await request.json();

    if (!base64Image) {
      return NextResponse.json(
        { error: "base64Image wajib diisi." },
        { status: 400 }
      );
    }

    const imageMime = mimeType || "image/jpeg";
    const isBackgroundOnly = extractMode === "background_only";

    const analysisInstruction = isBackgroundOnly
      ? `Analisis gambar ini dengan presisi teknis tinggi HANYA untuk mengekstrak elemen VISUAL LATAR BELAKANG (BACKGROUND).
ABAIKAN TOTAL semua teks, logo, orang, atau objek utama.
Tugas Anda: Berikan deskripsi teknis yang sangat detail untuk AI Image Generator (Flux/Midjourney/DALL-E) agar dapat mereplikasi estetika background ini secara akurat.
Wajib mencakup:
1. PALET WARNA & GRADASI: Sebutkan warna dominan, warna aksen, jenis gradasi (linear/radial/mesh), dan kontras pencahayaan secara spesifik.
2. KOMPOSISI GEOMETRIS: Jelaskan bentuk, garis, kurva, atau pola abstrak yang membentuk background. Sebutkan arah aliran visualnya.
3. TEKSTUR & MATERIAL: Deskripsikan apakah background terlihat smooth, grain, metallic, paper, atau digital vector art.
4. GAYA VISUAL: Tentukan apakah ini gaya corporate, futuristic, minimalist, oriental, atau luxury.
Pastikan deskripsi bersifat deskriptif-visual, bukan interpretatif.`
      : `Analisis gambar ini sebagai referensi desain utama untuk rekonstruksi digital banner/poster profesional.
Tugas Anda: Bedah seluruh elemen visual gambar ini secara teknis agar AI Image Generator dapat merekonstruksi layout, gaya, dan komposisinya dengan akurasi tinggi.
Fokus Analisis Teknis:
1. ARSITEKTUR LAYOUT: Jelaskan pembagian ruang, posisi elemen kunci, keseimbangan simetri/asimetri, dan focal point.
2. SISTEM WARNA: Analisis skema warna yang digunakan (complementary, analogous, dll) dan bagaimana warna didistribusikan.
3. GAYA ARTISTIK: Identifikasi gaya spesifik (misal: Modern Vector, Bauhaus, Swiss Style, Neumorphism, atau Traditional Arts). Sebutkan karakteristik garis (sharp, organic, bold).
4. DETAIL ELEMEN: Deskripsikan bentuk ornamen, efek shadow, glow, atau overlay yang ada.
5. ATMOSFER & MOOD: Tentukan vibe visual (misal: elegan, energik, formal, atau misterius) dan bagaimana pencahayaan menciptakan mood tersebut.
Hasil harus berupa deskripsi teknis mendalam yang siap dikonversi menjadi prompt AI.`;

    const geminiPayload = {
      contents: [
        {
          parts: [
            {
              text: analysisInstruction,
            },
            {
              inline_data: {
                mime_type: imageMime,
                data: base64Image,
              },
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 2048,
      },
    };

    const model = "gemini-3.5-flash";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.error?.message || `Gemini API Error (${response.status})` },
        { status: response.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
