import { describe, expect, it } from "vitest";
import { isPrivateIPv4, isPrivateIPv6 } from "./fetchOg";

describe("isPrivateIPv4", () => {
  it.each([
    ["10.0.0.1", true],
    ["127.0.0.1", true],
    ["169.254.1.1", true],
    ["172.16.0.1", true],
    ["172.31.255.255", true],
    ["192.168.1.1", true],
    ["100.64.0.1", true],
    ["0.0.0.0", true],
  ])("blocks %s as private", (ip, expected) => {
    expect(isPrivateIPv4(ip)).toBe(expected);
  });

  it.each([
    ["8.8.8.8", false],
    ["1.1.1.1", false],
    ["172.32.0.1", false], // fora do range privado 172.16-172.31
    ["172.15.255.255", false],
    ["93.184.216.34", false],
  ])("allows %s as public", (ip, expected) => {
    expect(isPrivateIPv4(ip)).toBe(expected);
  });

  it("blocks malformed input defensively", () => {
    expect(isPrivateIPv4("not-an-ip")).toBe(true);
  });
});

describe("isPrivateIPv6", () => {
  it.each(["::1", "fc00::1", "fd00::1", "fe80::1"])("blocks %s as private", (ip) => {
    expect(isPrivateIPv6(ip)).toBe(true);
  });

  it.each(["2001:4860:4860::8888", "2606:4700:4700::1111"])("allows %s as public", (ip) => {
    expect(isPrivateIPv6(ip)).toBe(false);
  });
});
