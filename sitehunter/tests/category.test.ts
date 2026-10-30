import { it, expect } from "vitest";
import { resolveTags } from "@/lib/providers/overpass";
it("resolve sinônimos e variações de categoria", () => {
  for (const c of ["Restaurantes", "Clínica odontológica", "Salão de beleza", "Oficina mecânica", "Mercearia", "gym", "Pousada", "Eletricista"]) expect(resolveTags(c), c).toBeDefined();
  expect(resolveTags("xyzabc")).toBeUndefined();
});
