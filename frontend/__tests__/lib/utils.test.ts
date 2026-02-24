import {
  cn,
  formatCurrency,
  formatBytes,
  formatSpeed,
  calculateDaysRemaining,
} from "@/lib/utils";

describe("cn", () => {
  it("should merge tailwind classes", () => {
    expect(cn("bg-red-500", "text-white", "bg-blue-500")).toBe(
      "text-white bg-blue-500"
    );
  });
});

describe("formatCurrency", () => {
  it("should format a number into KES currency", () => {
    expect(formatCurrency(1234.56)).toBe("KES 1,234.56");
  });

  it("should handle zero", () => {
    expect(formatCurrency(0)).toBe("KES 0.00");
  });

  it("should handle large numbers", () => {
    expect(formatCurrency(1000000)).toBe("KES 1,000,000.00");
  });
});

describe("formatBytes", () => {
  it("should return '0 Bytes' for 0 bytes", () => {
    expect(formatBytes(0)).toBe("0 Bytes");
  });

  it("should format bytes correctly", () => {
    expect(formatBytes(1024)).toBe("1 KB");
  });

  it("should format megabytes correctly", () => {
    expect(formatBytes(1048576)).toBe("1 MB");
  });

  it("should handle decimals", () => {
    expect(formatBytes(1500000, 2)).toBe("1.43 MB");
  });
});

describe("formatSpeed", () => {
  it("should return '0 bps' for 0 bps", () => {
    expect(formatSpeed(0)).toBe("0 bps");
  });

  it("should format bps correctly", () => {
    expect(formatSpeed(999)).toBe("999 bps");
  });

  it("should format kbps correctly", () => {
    expect(formatSpeed(1000)).toBe("1 kbps");
  });

  it("should format Mbps correctly", () => {
    expect(formatSpeed(1500000)).toBe("1.5 Mbps");
  });

  it("should handle decimals", () => {
    expect(formatSpeed(1555555, 3)).toBe("1.556 Mbps");
  });
});

describe("calculateDaysRemaining", () => {
  it("should return 0 for a past date", () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    expect(calculateDaysRemaining(pastDate.toISOString())).toBe(0);
  });

  it("should return 0 for today's date", () => {
    const today = new Date();
    expect(calculateDaysRemaining(today.toISOString())).toBe(0);
  });

  it("should return the correct number of days for a future date", () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 10);
    expect(calculateDaysRemaining(futureDate.toISOString())).toBe(10);
  });

  it("should handle the end of the year", () => {
    jest.useFakeTimers().setSystemTime(new Date("2024-12-25T12:00:00.000Z"));
    const expiryDate = "2025-01-05T00:00:00.000Z";
    expect(calculateDaysRemaining(expiryDate)).toBe(11);
    jest.useRealTimers();
  });
});
