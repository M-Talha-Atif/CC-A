
import { create } from "zustand";

const useHelpCenterStore = create((set) => ({
  isOpen: false,
  activeTab: "faq",
  openHelpCenter: (tab = "faq") => set({ isOpen: true, activeTab: tab }),
  closeHelpCenter: () => set({ isOpen: false }),
}));

export default useHelpCenterStore;
