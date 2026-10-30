import { it, expect } from "vitest";
import { findDuplicateIds } from "@/lib/leaddupes";
it("remove duplicata por telefone ou nome+endereço, mantendo o mais antigo", () => {
  const d = (id: string, t: number, snapshot: any) => ({ id, createdAt: new Date(t), snapshot });
  expect(findDuplicateIds([d("b", 2, { phone: "(11) 9999-0000" }), d("a", 1, { phone: "11 99990000" }), d("c", 3, { name: "Ação X", address: "Rua 1" }), d("e", 4, { name: "acao x", address: "rua 1" }), d("f", 5, { name: "Outro", address: "Rua 2" })])).toEqual(["b", "e"]);
});
