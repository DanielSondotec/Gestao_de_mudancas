import { useContext } from "react";
import { ChangesContext } from "../context/changesContext";

export function useChanges() {
  const ctx = useContext(ChangesContext);
  if (!ctx) throw new Error("useChanges deve ser usado dentro de <ChangesProvider>");
  return ctx;
}
