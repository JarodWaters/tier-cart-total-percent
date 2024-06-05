// @ts-check
import { DiscountApplicationStrategy } from "../generated/api";

/**
 * @typedef {import("../generated/api").RunInput} RunInput
 * @typedef {import("../generated/api").FunctionRunResult} FunctionRunResult
 */

/**
 * @type {FunctionRunResult}
 */
const EMPTY_DISCOUNT = {
  discountApplicationStrategy: DiscountApplicationStrategy.All,
  discounts: [],
};

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  console.log("Input Cart Cost:", JSON.stringify(input.cart.cost, null, 2));
  console.log("Input Cart Lines:", JSON.stringify(input.cart.lines, null, 2));

  const tierLevels = [
    { amount: 0, key: "tier1" },
    { amount: 250, key: "tier2" },
    { amount: 750, key: "tier3" },
    { amount: 2500, key: "tier4" },
    { amount: 4000, key: "tier5" },
  ];

  let cartTotal = parseFloat(input.cart.cost.totalAmount.amount);
  console.log("Initial Cart Total:", cartTotal);

  const eligibleTiers = tierLevels.filter(tier => cartTotal >= tier.amount);
  const excludedProducts = new Set();
  const excludedLines = new Set();

  // Exclude one product per eligible tier
  eligibleTiers.forEach(tier => {
    for (const line of input.cart.lines) {
      if (line.merchandise.product?.metafield?.value === tier.key && !excludedProducts.has(line.merchandise.id) && !excludedLines.has(line.id)) {
        cartTotal -= parseFloat(line.cost.totalAmount.amount) / line.quantity;
        excludedProducts.add(line.merchandise.id);
        excludedLines.add(line.id);
        break; // Exclude only one product per tier
      }
    }
  });

  console.log("Adjusted Cart Total (excluding free gifts):", cartTotal);

  let discountPercentage = 0;

  if (cartTotal >= 1000) {
    discountPercentage = 7;
  } else if (cartTotal >= 500) {
    discountPercentage = 5;
  } else if (cartTotal >= 250) {
    discountPercentage = 3;
  }

  console.log("Discount Percentage:", discountPercentage);

  if (discountPercentage === 0) {
    console.error("No discount applicable based on cart total.");
    return EMPTY_DISCOUNT;
  }

  const discount = {
    message: `Get ${discountPercentage}% off your order!`,
    targets: input.cart.lines.map(line => ({
      productVariant: {
        id: line.merchandise.id,
        quantity: line.quantity,
      }
    })),
    value: {
      percentage: {
        value: discountPercentage.toFixed(1),
      },
    },
  };

  console.log("Prepared Discount:", JSON.stringify(discount, null, 2));

  return {
    discounts: [discount],
    discountApplicationStrategy: DiscountApplicationStrategy.All,
  };
}
