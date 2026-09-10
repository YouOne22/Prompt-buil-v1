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

export type InputHistoryItem = {
  id: string;
  timestamp: string;
  title: string;
  formData: FormData;
};

const FORM_DATA_DEFAULTS: FormData = {
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
};

const normalizeFormData = (formData: Partial<FormData>): FormData => ({
  ...FORM_DATA_DEFAULTS,
  ...formData,
});

export type PromptStore = {
  formData: FormData;
  generatedJson: string | null;
  history: string[];
  inputHistory: InputHistoryItem[];
  setField: <K extends keyof FormData>(field: K, value: FormData[K]) => void;
  reset: () => void;
  setGeneratedJson: (json: string) => void;
  addHistory: (json: string) => void;
  loadHistory: () => void;
  saveInputHistory: (customTitle?: string) => void;
  loadInputHistoryItem: (item: InputHistoryItem) => void;
  deleteInputHistoryItem: (id: string) => void;
  clearInputHistory: () => void;
};

export const DESIGN_CATEGORIES = [
  { value: "Spanduk", group: "Outdoor / Indoor" },
  { value: "X-Banner", group: "Display / Promosi" },
  { value: "Roll Up Banner", group: "Display / Promosi" },
  { value: "Baliho", group: "Outdoor" },
  { value: "Billboard", group: "Outdoor" },
  { value: "Kartu Nama", group: "Cetak Korporat" },
  { value: "Poster", group: "Promosi / Event" },
  { value: "Flyer", group: "Promosi / Event" },
  { value: "Brosur", group: "Promosi / Event" },
  { value: "Stiker", group: "Merchandise" },
  { value: "Event", group: "Event" },
  { value: "Produk", group: "Produk" },
  { value: "Karakter", group: "Karakter" },
];

export const isEventCategory = (cat: string) => 
  ["Event", "Poster", "Flyer", "Brosur"].includes(cat);

export const isBusinessCard = (cat: string) => cat === "Kartu Nama";

export const isProductCategory = (cat: string) => 
  ["Produk", "Stiker"].includes(cat);

export const isOutdoorCategory = (cat: string) => 
  ["Spanduk", "Baliho", "Billboard", "X-Banner", "Roll Up Banner"].includes(cat);

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
      inputHistory: [],
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
      },
      saveInputHistory: (customTitle) => {
        const currentData = get().formData;
        const now = new Date();
        const timestamp = now.toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short",
        });
        const autoTitle =
          currentData.judulUtama ||
          currentData.kategoriDesain ||
          currentData.instruksiTambahan?.slice(0, 25) ||
          "Draf Input Form";
        const title = customTitle || autoTitle;

        const newItem: InputHistoryItem = {
          id: Date.now().toString(),
          timestamp,
          title,
          formData: { ...currentData },
        };

        set((state) => ({
          inputHistory: [newItem, ...state.inputHistory].slice(0, 50),
        }));
      },
      loadInputHistoryItem: (item) => {
        set(() => ({
          formData: normalizeFormData(item.formData),
          generatedJson: null,
        }));
      },
      deleteInputHistoryItem: (id) => {
        set((state) => ({
          inputHistory: state.inputHistory.filter((item) => item.id !== id),
        }));
      },
      clearInputHistory: () => {
        set(() => ({ inputHistory: [] }));
      },
    }),
    {
      name: "prompt-store",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        history: state.history,
        inputHistory: state.inputHistory,
      })
    }
  )
);