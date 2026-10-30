import { it, expect } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";
import { csvCell } from "@/lib/csv";
it("hash de senha valida só a senha correta", () => { const h = hashPassword("senha-correta-123"); expect(verifyPassword("senha-correta-123", h)).toBe(true); expect(verifyPassword("errada", h)).toBe(false); });
it("CSV neutraliza fórmulas e escapa aspas", () => { expect(csvCell("=1+1")).toBe("'=1+1"); expect(csvCell('a"b')).toBe('"a""b"'); });
