/** Convert rupees to paise for Razorpay (₹245 → 24500) */
export const rupeesToPaise = (rupees: number): number => Math.round(rupees * 100);

/** Convert paise to rupees (24500 → 245) */
export const paiseToRupees = (paise: number): number => paise / 100;

/** Round to 2 decimal places */
export const roundMoney = (amount: number): number =>
  Math.round(amount * 100) / 100;

/** Format as INR display string */
export const formatINR = (amount: number): string =>
  `₹${roundMoney(amount).toFixed(2)}`;
