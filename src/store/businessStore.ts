import { create } from "zustand";
import { persist } from "zustand/middleware";

// Název provozovny — používá se v provozním režimu pro oslovení v hlavičce
// a upozorněních (místo křestního jména jako u domácnosti).
interface BusinessStore {
  name: string;
  setName: (name: string) => void;
}

export const useBusinessStore = create<BusinessStore>()(
  persist(
    (set) => ({
      name: "",
      setName: (name) => set({ name }),
    }),
    { name: "business-name" }
  )
);
