/** Mask a phone number for logging: +91XXXXXXX890 → +91***890 */
export const maskPhone = (phone: string | null | undefined): string => {
  if (!phone) return '***';
  const clean = phone.replace(/\s/g, '');
  if (clean.length < 4) return '***';
  return clean.slice(0, 3) + '***' + clean.slice(-3);
};
