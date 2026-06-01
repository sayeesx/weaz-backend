/** Generate a human-readable Weaz order number */
export const generateOrderNumber = (): string => {
  const year = new Date().getFullYear();
  const rand = Math.floor(100000 + Math.random() * 900000);
  return `WZ-${year}-${rand}`;
};
