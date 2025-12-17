import { supabase } from "@/integrations/supabase/client";

export interface Benefit {
  id: string;
  label: string;
  base_price: number;
  region_multiplier?: number | null;
}

export interface PricingThreshold {
  id: string;
  threshold_type: 'benefit_count' | 'total_value' | 'tier_based';
  threshold_value: number;
  discount_percentage: number;
  discount_label: string;
  display_order: number;
}

export interface DynamicPricingResult {
  benefitTotal: number;
  appliedThresholds: PricingThreshold[];
  maxDiscount: number;
  discountedBenefitTotal: number;
  savings: number;
}

/**
 * Calculate the total price of selected benefits
 */
export function calculateBenefitTotal(
  benefits: Benefit[],
  regionMultiplier: number = 1.0
): number {
  return benefits.reduce((total, benefit) => {
    const benefitRegionMultiplier = benefit.region_multiplier || 1.0;
    const price = benefit.base_price * benefitRegionMultiplier * regionMultiplier;
    return total + price;
  }, 0);
}

/**
 * Fetch active pricing thresholds from the database
 */
export async function fetchPricingThresholds(): Promise<PricingThreshold[]> {
  const { data, error } = await supabase
    .from('pricing_thresholds')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error fetching pricing thresholds:', error);
    return [];
  }

  return (data || []) as PricingThreshold[];
}

/**
 * Determine which pricing thresholds apply based on benefit count and total value
 */
export function getApplicableThresholds(
  benefitCount: number,
  totalValue: number,
  thresholds: PricingThreshold[]
): PricingThreshold[] {
  const applicable: PricingThreshold[] = [];

  for (const threshold of thresholds) {
    if (threshold.threshold_type === 'benefit_count') {
      if (benefitCount >= threshold.threshold_value) {
        applicable.push(threshold);
      }
    } else if (threshold.threshold_type === 'total_value') {
      if (totalValue >= threshold.threshold_value) {
        applicable.push(threshold);
      }
    }
  }

  return applicable;
}

/**
 * Calculate the maximum discount from applicable thresholds
 * Takes the highest discount percentage available
 */
export function calculateMaxDiscount(thresholds: PricingThreshold[]): number {
  if (thresholds.length === 0) return 0;

  return Math.max(...thresholds.map(t => t.discount_percentage));
}

/**
 * Main function to calculate dynamic pricing with thresholds
 */
export async function calculateDynamicPricing(
  benefits: Benefit[],
  regionMultiplier: number = 1.0
): Promise<DynamicPricingResult> {
  // Calculate base benefit total
  const benefitTotal = calculateBenefitTotal(benefits, regionMultiplier);

  // Fetch pricing thresholds
  const allThresholds = await fetchPricingThresholds();

  // Get applicable thresholds
  const appliedThresholds = getApplicableThresholds(
    benefits.length,
    benefitTotal,
    allThresholds
  );

  // Calculate maximum discount
  const maxDiscount = calculateMaxDiscount(appliedThresholds);

  // Apply discount
  const discountMultiplier = 1 - (maxDiscount / 100);
  const discountedBenefitTotal = benefitTotal * discountMultiplier;
  const savings = benefitTotal - discountedBenefitTotal;

  return {
    benefitTotal,
    appliedThresholds,
    maxDiscount,
    discountedBenefitTotal,
    savings
  };
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}
