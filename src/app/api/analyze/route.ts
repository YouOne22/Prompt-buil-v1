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
      ? `Analisis gambar ini HANYA untuk mengambil elemen LATAR BELAKANG (BACKGROUND), POLA (PATTERN), TEKSTUR, dan PALET WARNA. 
ABAIKAN SEMUA TULISAN, TEKS, JUDUL, NOMOR, ATAU LOGO YANG ADA PADA GAMBAR REFERENSI. 
Tugas Anda: Buat deskripsi prompt untuk AI Image Generator agar menghasilkan background/backdrop digital bersih tanpa teks apapun, bergaya CorelDRAW / Adobe Illustrator vector art.`
      : `Analisis gambar ini sebagai referensi utama (sketsa pensil/layout) untuk pembuatan desain banner/poster digital.
Tugas Anda adalah mendeskripsikan gambar ini secara sangat detail agar AI Image Generator dapat merekonstruksi ulang sketsa ini menjadi desain digital yang profesional bergaya CorelDRAW & Adobe Illustrator.
Fokus Analisis:
1. STRUKTUR & LAYOUT: Jelaskan posisi elemen (judul, subjek, logo) sesuai sketsa.
2. GAYA VISUAL: Terjemahkan goresan sketsa menjadi art style digital vektor.
3. ELEMEN SUBJEK: Identifikasi objek apa saja yang digambar.
4. MOOD & ATMOSFER: Tentukan suasana yang terpancar dari komposisi sketsa.`;

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
        temperature: 0.3,
        maxOutputTokens: 1024,
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
