import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type FormData = {
  orientasi: "Landscape" | "Portrait" | "Square";
  ukuranBanner: string;
  warnaDominan: string;
  temaDesain: string;
  temaDesainCustom: string;
  kategoriDesain: string;
  tipeOutput: "print" | "mockup";
  judulUtama: string;
  subJudul: string;
  deskripsi: string;
  slogan: string;
  whatsapp: string;
  instagram: string;
  youtube: string;
  tiktok: string;
  facebook: string;
  alamat: string;
  kontakLain: string;
  tanggalAcara: string;
  waktuAcara: string;
  lokasiAcara: string;
  daftarNamaProduk: string;
  elemenPendukung: string;
  instruksiTambahan: string;
};

export type PromptStore = {
  formData: FormData;
  generatedJson: string | null;
  history: string[];
  setField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  reset: () => void;
  setGeneratedJson: (json: string) => void;
  addHistory: (json: string) => void;
  loadHistory: () => void;
};

export const DESIGN_CATEGORIES = [
  { value: "Event", group: "Event" },
  { value: "Produk", group: "Produk" },
  { value: "Karakter", group: "Karakter" },
];

export const isEventCategory = (cat: string) => cat === "Event";

export const usePromptStore = create<PromptStore>()(
  persist(
    (set, get) => ({
      formData: {
        orientasi: "Landscape",
        ukuranBanner: "",
        warnaDominan: "",
        temaDesain: "Modern & Minimalist",
        temaDesainCustom: "",
        kategoriDesain: "Produk",
        tipeOutput: "print",
        judulUtama: "",
        subJudul: "",
        deskripsi: "",
        slogan: "",
        whatsapp: "",
        instagram: "",
        youtube: "",
        tiktok: "",
        facebook: "",
        alamat: "",
        kontakLain: "",
        tanggalAcara: "",
        waktuAcara: "",
        lokasiAcara: "",
        daftarNamaProduk: "",
        elemenPendukung: "",
        instruksiTambahan: "",
      },
      generatedJson: null,
      history: [],
      setField: (field, value) =>
        set((state) => ({
          formData: { ...state.formData, [field]: value }
        })),
      reset: () =>
        set(() => ({
          formData: {
            orientasi: "Landscape",
            ukuranBanner: "",
            warnaDominan: "",
            temaDesain: "Modern & Minimalist",
            temaDesainCustom: "",
            kategoriDesain: "Produk",
            tipeOutput: "print",
            judulUtama: "",
            subJudul: "",
            deskripsi: "",
            slogan: "",
            whatsapp: "",
            instagram: "",
            youtube: "",
            tiktok: "",
            facebook: "",
            alamat: "",
            kontakLain: "",
            tanggalAcara: "",
            waktuAcara: "",
            lokasiAcara: "",
            daftarNamaProduk: "",
            elemenPendukung: "",
            instruksiTambahan: "",
          },
          generatedJson: null
        })),
      setGeneratedJson: (json) => set(() => ({ generatedJson: json })),
      addHistory: (json) =>
        set((state) => ({
          history: [json, ...state.history].slice(0, 100)
        })),
      loadHistory: () => {
        const stored = localStorage?.getItem("promptHistory");
        if (stored) {
          try {
            const arr = JSON.parse(stored);
            if (Array.isArray(arr)) set(() => ({ history: arr }));
          } catch (_) {}
        }
      }
    }),
    {
      name: "prompt-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ history: state.history })
    }
  )
);