import { it, expect } from "vitest";
import { isPrivateIp, safeUrl, verifyWebsite } from "@/lib/website";
it("detecta IPs internos", () => { for (const ip of ["127.0.0.1", "10.1.2.3", "192.168.0.5", "172.16.0.1", "169.254.169.254", "::1", "fd00::1", "::ffff:127.0.0.1"]) expect(isPrivateIp(ip), ip).toBe(true); expect(isPrivateIp("8.8.8.8")).toBe(false); });
it("safeUrl aceita só http(s) com domínio", () => {
  expect(safeUrl("javascript:alert(1)")).toBeUndefined(); expect(safeUrl("ftp://x.com")).toBeUndefined(); expect(safeUrl("localhost")).toBeUndefined();
  expect(safeUrl("www.exemplo.com.br")).toBe("https://www.exemplo.com.br/"); expect(safeUrl("http://a.com/x")).toBe("http://a.com/x");
});
it("não consulta endereços internos (resultado inconclusivo, sem rede)", async () => { expect(await verifyWebsite("http://127.0.0.1:8080")).toBe("inconclusive"); expect(await verifyWebsite("http://localhost")).toBe("inconclusive"); });
