DO $$
DECLARE
  v_business_id uuid;
BEGIN
  -- Insert Business
  INSERT INTO public.businesses (
    name, slug, type, description, default_language, support_phone, support_email
  ) VALUES (
    'Weaz',
    'weaz',
    '10-minute commerce and delivery',
    'Weaz is a fast commerce and delivery platform that helps customers order groceries, essentials, food items, and daily needs with fast local delivery.',
    'en',
    '+91 99999 99999',
    'support@weaz.in'
  ) RETURNING id INTO v_business_id;

  -- Insert Settings
  INSERT INTO public.business_settings (
    business_id, delivery_fee, free_delivery_above, estimated_delivery_minutes, currency, service_areas
  ) VALUES (
    v_business_id,
    25,
    299,
    10,
    'INR',
    ARRAY['Calicut', 'Kozhikode', 'Feroke', 'Ramanattukara', 'Beypore', 'Mavoor Road', 'Hilite City', 'Medical College', 'Kallai', 'Meenchanda']
  );

  -- Insert Products
  INSERT INTO public.products (business_id, name, category, description, unit, price, stock_quantity, tags) VALUES
  (v_business_id, 'Onion', 'Vegetables', 'Fresh onions', '1 kg', 40, 100, ARRAY['onion', 'vegetable', 'groceries']),
  (v_business_id, 'Tomato', 'Vegetables', 'Fresh tomatoes', '1 kg', 35, 80, ARRAY[]::text[]),
  (v_business_id, 'Potato', 'Vegetables', 'Fresh potatoes', '1 kg', 38, 90, ARRAY[]::text[]),
  (v_business_id, 'Milk Packet', 'Dairy', 'Fresh milk packet', '500 ml', 28, 120, ARRAY[]::text[]),
  (v_business_id, 'Bread', 'Bakery', 'Fresh bread packet', '1 packet', 45, 60, ARRAY[]::text[]),
  (v_business_id, 'Eggs', 'Dairy', 'Farm eggs', '6 pieces', 48, 70, ARRAY[]::text[]),
  (v_business_id, 'Banana', 'Fruits', 'Fresh bananas', '1 kg', 55, 50, ARRAY[]::text[]),
  (v_business_id, 'Apple', 'Fruits', 'Fresh apples', '1 kg', 180, 30, ARRAY[]::text[]),
  (v_business_id, 'Rice', 'Grocery', 'Premium rice', '5 kg', 320, 40, ARRAY[]::text[]),
  (v_business_id, 'Atta', 'Grocery', 'Wheat flour', '5 kg', 290, 35, ARRAY[]::text[]),
  (v_business_id, 'Oats', 'Health', 'Rolled oats', '1 kg', 190, 25, ARRAY[]::text[]),
  (v_business_id, 'Greek Yogurt', 'Dairy', 'Greek yogurt', '400 g', 120, 20, ARRAY[]::text[]),
  (v_business_id, 'Almond Milk', 'Health', 'Almond milk', '1 litre', 260, 15, ARRAY[]::text[]),
  (v_business_id, 'Chicken', 'Meat', 'Fresh chicken', '1 kg', 220, 25, ARRAY[]::text[]),
  (v_business_id, 'Fish', 'Meat', 'Fresh fish', '1 kg', 260, 20, ARRAY[]::text[]);

  -- Insert Knowledge Base
  INSERT INTO public.knowledge_base (business_id, title, content, category) VALUES
  (v_business_id, 'Delivery charges', 'Delivery is free for orders above ₹299. Orders below ₹299 have a ₹25 delivery fee.', 'Delivery'),
  (v_business_id, 'Delivery time', 'Weaz aims to deliver most local orders within 10 minutes, depending on product availability, distance, traffic, and rider availability.', 'Delivery'),
  (v_business_id, 'Service areas', 'Weaz currently serves selected areas in and around Calicut/Kozhikode including Feroke, Ramanattukara, Beypore, Mavoor Road, Hilite City, Medical College, Kallai, Meenchanda, and nearby local zones.', 'Delivery'),
  (v_business_id, 'Payment methods', 'Weaz supports UPI and online payment links. Cash on delivery can be added later.', 'Payments'),
  (v_business_id, 'Refund policy', 'If a wrong, damaged, missing, or expired product is delivered, the customer can raise a complaint. Weaz may offer replacement, refund, or wallet credit after verification.', 'Support'),
  (v_business_id, 'Wrong product policy', 'Ask the customer to share a photo, order number, and short issue description. Then create a support ticket for review.', 'Support'),
  (v_business_id, 'Human handoff', 'If a customer asks for a manager, human, agent, or support staff, create a support ticket and mark it as requiring human support.', 'Support'),
  (v_business_id, 'Store owner support', 'Store owners can ask about top-selling products, low-stock items, restocking suggestions, and order trends.', 'Business'),
  (v_business_id, 'Rider support', 'Delivery partners can ask for help when the customer is not responding, address is unclear, payment issue exists, or order cannot be delivered.', 'Rider'),
  (v_business_id, 'Cancellation', 'Customers can cancel before the order is packed. After packing or dispatch, cancellation depends on order status and support review.', 'Orders');

END $$;
