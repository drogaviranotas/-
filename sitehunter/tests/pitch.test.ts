import { it, expect } from "vitest";
import { pitch } from "@/lib/pitch";
it("mensagem inclui o nome da empresa", () => expect(pitch("Padaria Sol")).toContain("Padaria Sol"));
