/**
 * @file evolution-tier.test.ts
 * @description Unit tests for Personal Best evolution tier thresholds (Tiers 0 to 10).
 */

import { describe, it, expect } from "vitest";
import {
  getEvolutionTier,
  getTierThreshold,
  TIER_THRESHOLDS_NORMAL,
  TIER_THRESHOLDS_EXPERT,
  TIER_THRESHOLDS_MASTER,
} from "./evolution-tier";

describe("evolution-tier engine", () => {
  describe("Normal Mode", () => {
    it("keeps typing below Tier 1 thresholds firmly at Tier 0", () => {
      expect(getEvolutionTier("normal", 20, 95)).toBe(0);
      expect(getEvolutionTier("normal", 29.9, 100)).toBe(0);
      expect(getEvolutionTier("normal", 50, 75)).toBe(0); // High speed but insufficient accuracy for Tier 1
    });

    it("requires at least 30 WPM and 80% accuracy to unlock Tier 1", () => {
      expect(getEvolutionTier("normal", 30, 80)).toBe(1);
      expect(getEvolutionTier("normal", 40, 99)).toBe(1);
      expect(getEvolutionTier("normal", 44.9, 100)).toBe(1);
      expect(getEvolutionTier("normal", 80, 80)).toBe(1); // 80 WPM with 80% accuracy (< 85% for Tier 2) stays Tier 1
    });

    it("requires at least 45 WPM and 85% accuracy to unlock Tier 2", () => {
      expect(getEvolutionTier("normal", 45, 85)).toBe(2);
      expect(getEvolutionTier("normal", 45, 84.9)).toBe(1);
      expect(getEvolutionTier("normal", 59, 87)).toBe(2);
    });

    it("evaluates all progression thresholds accurately (Tiers 3 to 10)", () => {
      expect(getEvolutionTier("normal", 60, 88)).toBe(3);
      expect(getEvolutionTier("normal", 75, 90)).toBe(4);
      expect(getEvolutionTier("normal", 90, 92)).toBe(5);
      expect(getEvolutionTier("normal", 105, 94)).toBe(6);
      expect(getEvolutionTier("normal", 120, 96)).toBe(7);
      expect(getEvolutionTier("normal", 135, 97)).toBe(8);
      expect(getEvolutionTier("normal", 150, 98)).toBe(9);
      expect(getEvolutionTier("normal", 165, 99)).toBe(10);
      expect(getEvolutionTier("normal", 200, 100)).toBe(10);
    });

    it("handles fallback to default mode when difficulty is null or undefined", () => {
      expect(getEvolutionTier(null, 45, 85)).toBe(2);
      expect(getEvolutionTier(undefined, 165, 99)).toBe(10);
      expect(getEvolutionTier("", 30, 90)).toBe(1);
      expect(getEvolutionTier("", 20, 90)).toBe(0);
    });
  });

  describe("Expert Mode", () => {
    it("keeps typing below 40 WPM or below 85% accuracy at Tier 0", () => {
      expect(getEvolutionTier("expert", 35, 99)).toBe(0);
      expect(getEvolutionTier("expert", 39.9, 99)).toBe(0);
      expect(getEvolutionTier("expert", 80, 80)).toBe(0);
    });

    it("requires at least 40 WPM and 85% accuracy for Tier 1", () => {
      expect(getEvolutionTier("expert", 40, 85)).toBe(1);
      expect(getEvolutionTier("expert", 54, 98)).toBe(1);
      expect(getEvolutionTier("expert", 80, 86)).toBe(1); // < 90% accuracy stays Tier 1
    });

    it("requires at least 55 WPM and 90% accuracy for Tier 2", () => {
      expect(getEvolutionTier("expert", 55, 90)).toBe(2);
      expect(getEvolutionTier("expert", 55, 89.9)).toBe(1);
    });

    it("evaluates all progression thresholds accurately (Tiers 3 to 10)", () => {
      expect(getEvolutionTier("expert", 70, 92)).toBe(3);
      expect(getEvolutionTier("expert", 85, 94)).toBe(4);
      expect(getEvolutionTier("expert", 100, 95)).toBe(5);
      expect(getEvolutionTier("expert", 115, 96)).toBe(6);
      expect(getEvolutionTier("expert", 130, 97)).toBe(7);
      expect(getEvolutionTier("expert", 145, 98)).toBe(8);
      expect(getEvolutionTier("expert", 160, 99)).toBe(9);
      expect(getEvolutionTier("expert", 175, 99.5)).toBe(10);
      expect(getEvolutionTier("expert", 210, 100)).toBe(10);
    });
  });

  describe("Master Mode", () => {
    it("keeps typing below 40 WPM at Tier 0 regardless of accuracy", () => {
      expect(getEvolutionTier("master", 25, 100)).toBe(0);
      expect(getEvolutionTier("master", 39.9, 100)).toBe(0);
    });

    it("requires at least 40 WPM for Tier 1", () => {
      expect(getEvolutionTier("master", 40, 100)).toBe(1);
      expect(getEvolutionTier("master", 50, 100)).toBe(1);
      expect(getEvolutionTier("master", 59.9, 100)).toBe(1);
    });

    it("requires at least 60 WPM for Tier 2", () => {
      expect(getEvolutionTier("master", 60, 100)).toBe(2);
      expect(getEvolutionTier("master", 79, 100)).toBe(2);
    });

    it("evaluates all progression thresholds accurately (Tiers 3 to 10)", () => {
      expect(getEvolutionTier("master", 80, 100)).toBe(3);
      expect(getEvolutionTier("master", 100, 100)).toBe(4);
      expect(getEvolutionTier("master", 120, 100)).toBe(5);
      expect(getEvolutionTier("master", 140, 100)).toBe(6);
      expect(getEvolutionTier("master", 160, 100)).toBe(7);
      expect(getEvolutionTier("master", 180, 100)).toBe(8);
      expect(getEvolutionTier("master", 200, 100)).toBe(9);
      expect(getEvolutionTier("master", 220, 100)).toBe(10);
      expect(getEvolutionTier("master", 260, 100)).toBe(10);
    });
  });

  describe("Boundary & Edge Cases", () => {
    it("safely handles 0, negative values, and non-finite inputs", () => {
      expect(getEvolutionTier("normal", 0, 0)).toBe(0);
      expect(getEvolutionTier("normal", -50, -10)).toBe(0);
      expect(getEvolutionTier("normal", NaN, NaN)).toBe(0);
      expect(getEvolutionTier("master", Infinity, 100)).toBe(10);
    });

    it("getTierThreshold returns correct threshold metadata and clamps bounds", () => {
      const normalT0 = getTierThreshold("normal", 0);
      expect(normalT0.minWpm).toBe(0);
      expect(normalT0.minAccuracy).toBe(0);

      const normalT1 = getTierThreshold("normal", 1);
      expect(normalT1.minWpm).toBe(30);
      expect(normalT1.minAccuracy).toBe(80);

      const normalT10 = getTierThreshold("normal", 10);
      expect(normalT10.minWpm).toBe(165);
      expect(normalT10.minAccuracy).toBe(99);

      const expertT1 = getTierThreshold("expert", 1);
      expect(expertT1.minWpm).toBe(40);
      expect(expertT1.minAccuracy).toBe(85);

      const expertT2 = getTierThreshold("expert", 2);
      expect(expertT2.minWpm).toBe(55);
      expect(expertT2.minAccuracy).toBe(90);

      const masterT1 = getTierThreshold("master", 1);
      expect(masterT1.minWpm).toBe(40);

      const masterT10 = getTierThreshold("master", 10);
      expect(masterT10.minWpm).toBe(220);

      // Clamp negative tier to 0, excess tier to 10
      expect(getTierThreshold("master", -5).tier).toBe(0);
      expect(getTierThreshold("normal", 99).tier).toBe(10);
    });

    it("validates all threshold table lengths are strictly 11 items (Tiers 0 to 10)", () => {
      expect(TIER_THRESHOLDS_NORMAL).toHaveLength(11);
      expect(TIER_THRESHOLDS_EXPERT).toHaveLength(11);
      expect(TIER_THRESHOLDS_MASTER).toHaveLength(11);
    });
  });
});
