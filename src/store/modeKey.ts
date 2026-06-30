// Zpětně kompatibilní alias. Dřív tu byla duplicitní kopie logiky čtení módu;
// jediným zdrojem pravdy je teď getCurrentMode() v modeStore.
import { getCurrentMode } from "@/store/modeStore";

export function getModeKey(): "domacnost" | "provoz" {
  return getCurrentMode();
}
