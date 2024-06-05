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
 * Function to check if a line is a free gift
 * @param {Object} line - The line item to check
 * @returns {boolean} - True if the line is a free gift, false otherwise
 */
function isFreeGift(line) {
  const freeGiftMetafields = ['tier1', 'tier2', 'tier3', 'tier4', 'tier5'];
  const metafieldValue = line.merchandise.product?.metafield?.value;
  return freeGiftMetafields.includes(metafieldValue);
}

/**
 * @param {RunInput} input
 * @returns {FunctionRunResult}
 */
export function run(input) {
  console.log("Input Cart Cost:", JSON.stringify(input.cart.cost, null, 2));
  console.log("Input Cart Lines:", JSON.stringify(input.cart.lines, null, 2));

  // Calculate the cart total excluding free gifts
  const cartTotal = input.cart.lines.reduce((total, line) => {
    if (!isFreeGift(line)) {
      return total + parseFloat(line.cost.totalAmount.amount);
    }
    return total;
  }, 0);

  console.log("Adjusted Cart Total (excluding free gifts):", cartTotal);

  // Determine the discount percentage based on cart total
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
    targets: input.cart.lines.filter(line => !isFreeGift(line)).map(line => ({
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
