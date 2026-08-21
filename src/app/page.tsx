"use client";

import React, { useState } from "react";
import { usePromptStore } from "@/store/usePromptStore";
import { 
  DESIGN_CATEGORIES, 
  isEventCategory, 
  isBusinessCard, 
  isProductCategory, 
  isOutdoorCategory 
} from "@/store/usePromptStore";
import {
  LogoDropZone,
  SubjectDropZone,
  ReferenceDropZone,
  AudioDropZone,
  FileState,
} from "@/components/DropZones";
import {
  Mic,
  MicOff,
  Trash2,
  Copy,
  CheckCircle,
  Wand2,
  Volume2,
  HelpCircle,
  User,
  LogOut,
  Sparkles,
} from "lucide-react";

// Parse size string like "300x200" or "3x1m" into width and height
const parseDimensions = (sizeStr: string) => {
  const match = sizeStr?.match(
    /(\d+)\s*[xX]\s*(\d+)\s*(px|m|cm|mm|in|inch|meter|meters)?/i
  );
  if (match) {
    return {
      width: match[1],
      height: match[2],
      unit: match[3]?.toLowerCase() || "",
    };
  }
  return { width: "", height: "", unit: "" };
};

export default function PromptStudioBanner() {
  const { formData, setField, reset, generatedJson, setGeneratedJson, addHistory } = usePromptStore();
  const [isRecording, setIsRecording] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [promptSourceType, setPromptSourceType] = useState<string>("Template Default");
  const [extractMode, setExtractMode] = useState<"full" | "background_only">("full");

  const [files, setFiles] = useState<FileState>({
    logo: [],
    subject: [],
    reference: null,
    audio: null,
  });

  const handleReset = () => {
    reset();
    setFiles({ logo: [], subject: [], reference: null, audio: null });
    setPromptSourceType("Template Default");
  };

  const handleCopy = () => {
    if (generatedJson) {
      navigator.clipboard.writeText(generatedJson);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  // Speech Recognition
  const toggleSpeech = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Fitur Web Speech API tidak didukung di browser ini.");
      return;
    }
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "id-ID";
    recognition.continuous = true;
    recognition.interimResults = true;

    if (isRecording) {
      recognition.stop();
      setIsRecording(false);
    } else {
      setIsRecording(true);
      recognition.start();
      recognition.onresult = (e: any) => {
        let transcript = "";
        for (let i = e.resultIndex; i < e.results.length; ++i) {
          transcript += e.results[i][0].transcript;
        }
        const currentInstruksi = formData.instruksiTambahan;
        setField(
          "instruksiTambahan",
          currentInstruksi ? `${currentInstruksi}\n${transcript}` : transcript
        );
      };
      recognition.onerror = () => setIsRecording(false);
      recognition.onend = () => setIsRecording(false);
    }
  };

  const handleGenerate = async () => {
    setIsAnalyzing(true);
    let aiVisualAnalysis = "Perpaduan realisme dan seni grafis oriental";
    let isUsingVision = false;
    let apiErrorMessage: string | null = null;

    if (files.reference) {
      isUsingVision = true;
      try {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onload = () => resolve((reader.result as string).split(",")[1]);
          reader.readAsDataURL(files.reference!);
        });
        const base64Image = await base64Promise;

        // Panggil Next.js API Route Internal (Server Side)
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            base64Image,
            mimeType: files.reference.type || "image/jpeg",
            extractMode,
          }),
        });

        const data = await response.json();
        if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
          aiVisualAnalysis = data.candidates[0].content.parts[0].text.trim();
        } else {
          apiErrorMessage =
            data.error || `API Error (${response.status}): Gagal memproses gambar referensi.`;
        }
      } catch (error: any) {
        apiErrorMessage =
          error?.message || "Koneksi ke Server API gagal. Periksa server Anda.";
      }

      if (apiErrorMessage) {
        alert(
          `⚠️ Peringatan AI Vision:\n\n${apiErrorMessage}\n\nSistem akan menggunakan template default tema desain (${formData.temaDesain}) agar Anda tetap bisa melanjutkan generate gambar.`
        );
        aiVisualAnalysis = `Gaya visual ${formData.temaDesain.toLowerCase()} dengan detail artistik`;
      }
    }
    setIsAnalyzing(false);

    const sourceDescription = isUsingVision
      ? apiErrorMessage
        ? `Fallback Default (API Vision Gagal - ${formData.temaDesain})`
        : "AI Vision Analysis dari Gambar Referensi"
      : `Template Default / Tema Desain (${formData.temaDesain})`;
    setPromptSourceType(sourceDescription);

    const colors = formData.warnaDominan
      ? formData.warnaDominan.split(",").map((c) => c.trim())
      : isUsingVision && !apiErrorMessage
      ? []
      : ["Marun", "Emas", "Hitam"];

    const selectedTheme =
      formData.temaDesain === "Custom (Tulis Sendiri)"
        ? formData.temaDesainCustom || "Custom Design"
        : formData.temaDesain;

    const formattedPrompt = {
      sumber_analisis: sourceDescription,
      jenis_desain: `Banner ${formData.orientasi}`,
      kategori_desain: formData.kategoriDesain,
      tipe_output: formData.tipeOutput,
            ukuran: (() => {
        const { width, height, unit } = parseDimensions(formData.ukuranBanner || "");
        return {
          lebar: width || formData.ukuranBanner || "A3",
          tinggi: height || formData.ukuranBanner || "A3",
          satuan: unit || (width ? "piksel (px)" : "ISO 216 / 300 DPI High Resolution"),
                rasio:
          formData.orientasi === "Landscape"
            ? "1.41:1"
            : formData.orientasi === "Portrait"
            ? "1:1.41"
            : "1:1",
        orientasi: formData.orientasi,
      };
    })(),
      tujuan_penggunaan: `Visual branding bertema ${selectedTheme.toLowerCase()} untuk cetak besar`,
      tema_desain: selectedTheme,
      gaya_visual: `${aiVisualAnalysis}, professional vector graphic art, CorelDRAW vector art style, Adobe Illustrator vector illustration, clean bezier curves, precise geometric shapes, sharp vector linework, flat design elements, graphic design layout, professional commercial graphic art, zero AI artifacts, crisp vector rendering`,
      aturan_integrasi_subjek: {
        catatan_penting:
          "JANGAN MENGUBAH / MEREKONSTRUKSI FOTO SUBJEK (WAJAH, EKSPRESI, POSTUR, TANGAN, ATRIBUT FISIK).",
        instruksi_cutout:
          "Hanya hapus background asli foto subjek (transparent cutout/background removal).",
        blending:
          "Blend dan sesuaikan pencahayaan (rim lighting, color grading) subjek agar menyatu secara harmonis dan natural dengan latar belakang poster tanpa terlihat sebagai tempelan kasar.",
      },
      aturan_render_teks: {
        akurasi_ejaan:
          "Eja dan render semua teks data secara persis (exact spelling) tanpa ada typo, karakter acak, atau distorsi AI.",
        hierarki_layout: `Susunan hierarki tata letak adaptif dan profesional berdasarkan tema ${selectedTheme}.`,
      },
      warna_utama: colors,
      warna_pendukung: formData.warnaDominan
        ? []
        : isUsingVision && !apiErrorMessage
        ? []
        : ["Putih", "Abu-abu tinta"],
      background:
        isUsingVision && !apiErrorMessage
          ? `${aiVisualAnalysis}, background artistik dengan resolusi tinggi, 300 DPI print quality`
          : `Latar belakang artistik gaya ${selectedTheme} dengan tekstur visual mendalam, 300 DPI high-res print quality, bebas noise digital`,
      elemen_ornamen: formData.elemenPendukung
        ? formData.elemenPendukung.split(",").map((s) => s.trim()).filter(Boolean)
        : [],
      data_teks: {
        judul_utama: formData.judulUtama || "",
        subjudul: formData.subJudul || "",
        informasi_tambahan: formData.deskripsi
          ? formData.deskripsi.split("\n").filter(Boolean)
          : [],
        kontak: formData.whatsapp || formData.kontakLain || "",
        alamat: formData.alamat || "",
        cta: formData.slogan || "",
      },
      ...(isEventCategory(formData.kategoriDesain) && {
        detail_acara: {
          tanggal: formData.tanggalAcara,
          waktu: formData.waktuAcara,
          lokasi: formData.lokasiAcara,
        },
      }),
    };

    setGeneratedJson(JSON.stringify(formattedPrompt, null, 2));
    addHistory(JSON.stringify(formattedPrompt, null, 2));
  };

        return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-4 sm:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <header className="flex flex-col sm:flex-row justify-between items-center bg-slate-800 border border-slate-700 p-4 sm:p-6 rounded-2xl shadow-2xl gap-4">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg shadow-blue-500/30">
              <Sparkles size={24} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                Prompt Studio Banner
                <span className="text-xs bg-blue-500/20 text-blue-400 border border-blue-500/30 font-bold px-2 py-0.5 rounded-full">
                  v1.3
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                AI Multimodal Banner & Poster Prompt Builder
              </p>
            </div>
          </div>

                              <div className="flex items-center gap-4 text-sm font-medium">
            <div className="bg-slate-900 border border-slate-700 px-3 py-1.5 rounded-xl text-amber-400 font-mono text-xs flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
              Desainer
            </div>
            
            <div className="flex items-center gap-2 border-l border-slate-700 pl-4">
              <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center font-bold text-xs text-white">
                <User size={14} />
              </div>
              <button className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1">
                You-One Art
              </button>
            </div>
          </div>
        </header>

        {/* Form Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Panel 1 */}
          <section className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg space-y-3">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700 pb-2">
              1. Data Informasi (Teks) & Pengaturan Umum
            </h2>
            <div className="space-y-2.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tipe Desain / Kategori</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                  value={formData.kategoriDesain}
                  onChange={(e) => setField("kategoriDesain", e.target.value)}
                >
                  {DESIGN_CATEGORIES.map((cat: { value: string; group: string }) => (
                    <option key={cat.value} value={cat.value}>
                      {cat.value} ({cat.group})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-xs text-slate-400">Mode Output:</span>
                <button
                  type="button"
                  className={`px-3 py-1 rounded ${
                    formData.tipeOutput === "print"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300"
                  } text-xs`}
                  onClick={() => setField("tipeOutput", "print")}
                >
                  Desain Siap Cetak
                </button>
                <button
                  type="button"
                  className={`px-3 py-1 rounded ${
                    formData.tipeOutput === "mockup"
                      ? "bg-blue-600 text-white"
                      : "bg-slate-700 text-slate-300"
                  } text-xs`}
                  onClick={() => setField("tipeOutput", "mockup")}
                >
                  Mockup Preview
                </button>
              </div>

              {isEventCategory(formData.kategoriDesain) && (
                                <div className="space-y-2">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Tanggal Acara</label>
                    <input
                      type="date"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-1 text-xs text-white outline-none"
                      value={formData.tanggalAcara}
                      onChange={(e) => setField("tanggalAcara", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Waktu Mulai</label>
                    <input
                      type="time"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-1 text-xs text-white outline-none"
                      value={formData.waktuAcara}
                      onChange={(e) => setField("waktuAcara", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Lokasi Acara</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-1 text-xs text-white outline-none"
                      placeholder="Contoh: Aula Utama, Gedung A"
                      value={formData.lokasiAcara}
                      onChange={(e) => setField("lokasiAcara", e.target.value)}
                    />
                  </div>
                </div>
              )}

              {isBusinessCard(formData.kategoriDesain) && (
                <div className="space-y-2 bg-slate-900/50 p-3 rounded-xl border border-slate-700/50">
                  <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">Informasi Kartu Nama</span>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nama Lengkap / Jabatan</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-1.5 text-xs text-white outline-none"
                      placeholder="e.g. John Doe, S.Kom. (Manager)"
                      value={formData.subJudul}
                      onChange={(e) => setField("subJudul", e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Nama Perusahaan / Brand</label>
                    <input
                      type="text"
                      className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-1.5 text-xs text-white outline-none"
                      placeholder="e.g. PT Maju Jaya Mandiri"
                      value={formData.judulUtama}
                      onChange={(e) => setField("judulUtama", e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-xs text-slate-400 block mb-1">Judul Utama</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white outline-none transition-all"
                  placeholder="e.g. PROMO MERDEKA, Happy Guardian"
                  value={formData.judulUtama}
                  onChange={(e) => setField("judulUtama", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Sub Judul</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white outline-none transition-all"
                  placeholder="e.g. Natalia Helynah Sp.J."
                  value={formData.subJudul}
                  onChange={(e) => setField("subJudul", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Informasi Data / Deskripsi</label>
                <textarea
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white outline-none transition-all resize-none"
                  placeholder="Detail penawaran atau poin utama..."
                  value={formData.deskripsi}
                  onChange={(e) => setField("deskripsi", e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">Slogan</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2.5 text-xs text-white outline-none transition-all"
                  placeholder="e.g. Cepat, Murah, Enak"
                  value={formData.slogan}
                  onChange={(e) => setField("slogan", e.target.value)}
                />
              </div>
            </div>
          </section>

          {/* Panel 2 */}
          <section className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg space-y-3">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700 pb-2">
              2. Kontak & Alamat
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                className="bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                placeholder="WhatsApp"
                value={formData.whatsapp}
                onChange={(e) => setField("whatsapp", e.target.value)}
              />
              <input
                type="text"
                className="bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                placeholder="Instagram"
                value={formData.instagram}
                onChange={(e) => setField("instagram", e.target.value)}
              />
              <input
                type="text"
                className="bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                placeholder="YouTube"
                value={formData.youtube}
                onChange={(e) => setField("youtube", e.target.value)}
              />
              <input
                type="text"
                className="bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                placeholder="TikTok"
                value={formData.tiktok}
                onChange={(e) => setField("tiktok", e.target.value)}
              />
              <input
                type="text"
                className="bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none col-span-2"
                placeholder="Facebook"
                value={formData.facebook}
                onChange={(e) => setField("facebook", e.target.value)}
              />
            </div>
            <textarea
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none resize-none"
              placeholder="Alamat Lengkap"
              value={formData.alamat}
              onChange={(e) => setField("alamat", e.target.value)}
            />
            <input
              type="text"
              className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
              placeholder="Kontak Lain / Website"
              value={formData.kontakLain}
              onChange={(e) => setField("kontakLain", e.target.value)}
            />
          </section>

          {/* Panel 3 */}
          <section className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg space-y-3">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700 pb-2">
              3. Bahan Visual
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <LogoDropZone files={files} setFiles={setFiles} />
              <SubjectDropZone files={files} setFiles={setFiles} />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Daftar Nama Produk / Menu</label>
              <textarea
                rows={2}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none resize-none"
                placeholder="Daftar menu dipisahkan baris baru..."
                value={formData.daftarNamaProduk}
                onChange={(e) => setField("daftarNamaProduk", e.target.value)}
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Elemen Pendukung Lain</label>
              <input
                type="text"
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                placeholder="e.g. Pedang & Gaun Donghua"
                value={formData.elemenPendukung}
                onChange={(e) => setField("elemenPendukung", e.target.value)}
              />
            </div>
          </section>

          {/* Panel 4 */}
          <section className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg space-y-3 lg:col-span-2">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700 pb-2">
              4. Spesifikasi & AI Referensi (Image-to-Prompt)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Orientasi</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                  value={formData.orientasi}
                  onChange={(e) => setField("orientasi", e.target.value as "Landscape" | "Portrait" | "Square")}
                >
                  <option value="Landscape">Landscape</option>
                  <option value="Portrait">Portrait</option>
                  <option value="Square">Square</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Ukuran Banner</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                                    placeholder="e.g. 300x200, 3x1m, A3"
                  value={formData.ukuranBanner}
                  onChange={(e) => setField("ukuranBanner", e.target.value)}
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Warna Dominan</label>
                <input
                  type="text"
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                  placeholder="e.g. Marun, Emas, Hitam"
                  value={formData.warnaDominan}
                  onChange={(e) => setField("warnaDominan", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tema Desain</label>
                <select
                  className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                  value={formData.temaDesain}
                  onChange={(e) => setField("temaDesain", e.target.value)}
                >
                  <option value="Modern & Minimalist">Modern & Minimalist</option>
                  <option value="Bold & Colorful">Bold & Colorful</option>
                  <option value="Classic & Elegant">Classic & Elegant</option>
                  <option value="Professional & Corporate">Professional & Corporate</option>
                  <option value="Fun & Playful">Fun & Playful</option>
                  <option value="Vintage / Retro">Vintage / Retro</option>
                  <option value="Custom (Tulis Sendiri)">Custom (Tulis Sendiri)</option>
                </select>
              </div>

              {formData.temaDesain === "Custom (Tulis Sendiri)" && (
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Tema Desain Custom</label>
                  <input
                    type="text"
                    className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none"
                    placeholder="e.g. referensi oriental"
                    value={formData.temaDesainCustom}
                    onChange={(e) => setField("temaDesainCustom", e.target.value)}
                  />
                </div>
              )}
            </div>

            <ReferenceDropZone
              files={files}
              setFiles={setFiles}
              extractMode={extractMode}
              setExtractMode={setExtractMode}
            />
          </section>

          {/* Panel 5 & 6 */}
          <section className="bg-slate-800 border border-slate-700 p-5 rounded-2xl shadow-lg space-y-3">
            <h2 className="text-sm font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-700 pb-2">
              5 & 6. Perintah Khusus & Audio
            </h2>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Instruksi Tambahan (Optional)</label>
              <textarea
                rows={3}
                className="w-full bg-slate-900 border border-slate-700 focus:border-blue-500 rounded-lg p-2 text-xs text-white outline-none resize-none"
                placeholder="Petunjuk artistik khusus..."
                value={formData.instruksiTambahan}
                onChange={(e) => setField("instruksiTambahan", e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2 border-t border-slate-700">
              <label className="text-xs text-slate-400 block">Live Speech Recording</label>
              <button
                type="button"
                onClick={toggleSpeech}
                className={`w-full py-2 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                  isRecording
                    ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse"
                    : "bg-blue-600 hover:bg-blue-500 text-white"
                }`}
              >
                {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                {isRecording ? "Stop Recording" : "Mulai Live Recording Speech-to-Text"}
              </button>
              <AudioDropZone files={files} setFiles={setFiles} />
            </div>
          </section>
        </div>

        {/* Action Controls */}
        <div className="flex flex-col sm:flex-row gap-4 pt-4">
          <button
            onClick={handleGenerate}
            disabled={isAnalyzing}
            className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-bold text-base shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 transition-all cursor-pointer disabled:opacity-50"
          >
            <Wand2 size={20} />
            {isAnalyzing ? "Menganalisis Referensi..." : "Generate Design Prompt ->"}
          </button>
          <button
            onClick={handleReset}
            className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 py-4 px-8 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Trash2 size={18} /> Kosongkan Semua Data Form
          </button>
        </div>

        {/* Output */}
        {generatedJson && (
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative space-y-3">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-800 pb-3 gap-2">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-widest font-mono flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                  Structured AI Prompt (JSON Output)
                </span>
                <p className="text-[11px] text-blue-400 font-medium mt-1">
                  Sumber Analisis: <span className="underline">{promptSourceType}</span>
                </p>
              </div>
              <button
                onClick={handleCopy}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                {copySuccess ? (
                  <>
                    <CheckCircle size={14} className="text-emerald-400" /> Tersalin!
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Salin Hasil Prompt (Copy)
                  </>
                )}
              </button>
            </div>
            <pre className="text-emerald-400 font-mono text-xs overflow-x-auto p-4 bg-slate-900/50 rounded-xl border border-slate-800/50 leading-relaxed">
              {generatedJson}
            </pre>
          </div>
                )}
      </div>
    </main>
  );
}