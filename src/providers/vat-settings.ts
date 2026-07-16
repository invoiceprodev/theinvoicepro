import { useEffect, useState } from "react";

export interface VatSettings {
  vatEnabled: boolean;
  vatRate: number;
  vatNumber: string;
}

const STORAGE_KEY = "invoicepro-vat-settings";

const DEFAULT_SETTINGS: VatSettings = {
  vatEnabled: true,
  vatRate: 15,
  vatNumber: "",
};

function loadSettings(): VatSettings {
  if (typeof window === "undefined") {
    return DEFAULT_SETTINGS;
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as Partial<VatSettings>) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function useVatSettings() {
  const [settings, setSettings] = useState<VatSettings>(loadSettings);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  function saveSettings(next: Partial<VatSettings>) {
    setSettings((current) => ({ ...current, ...next }));
  }

  return { settings, saveSettings };
}
