/**
 * Weaz business constants.
 * The businesses table EXISTS with a real row.
 * business_id = '9194479d-3ae9-4a80-893a-3b4913b97208'
 */
export const WEAZ_BUSINESS_ID = '9194479d-3ae9-4a80-893a-3b4913b97208';

export interface WeazSettings {
  id: string;
  slug: string;
  name: string;
  type: string;
  currency: string;
  deliveryFee: number;
  freeDeliveryAbove: number;
  estimatedDeliveryMinutes: number;
  serviceAreas: readonly string[];
  operatingHours: string;
  minimumOrderValue: number;
}

export const WEAZ_BUSINESS: WeazSettings = {
  id: WEAZ_BUSINESS_ID,
  slug: 'weaz',
  name: 'Weaz',
  type: '10-minute commerce and delivery',
  currency: 'INR',
  deliveryFee: 25,
  freeDeliveryAbove: 299,
  estimatedDeliveryMinutes: 10,
  serviceAreas: [
    'Calicut', 'Kozhikode', 'Feroke', 'Ramanattukara',
    'Beypore', 'Mavoor Road', 'Hilite City',
  ],
  operatingHours: '7:00 AM - 11:00 PM',
  minimumOrderValue: 0,
} as const;
