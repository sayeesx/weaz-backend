-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_interactions ENABLE ROW LEVEL SECURITY;

-- profiles
CREATE POLICY "user can select own profile" ON public.profiles FOR SELECT USING (id = auth.uid());
CREATE POLICY "user can insert own profile" ON public.profiles FOR INSERT WITH CHECK (id = auth.uid());
CREATE POLICY "user can update own profile" ON public.profiles FOR UPDATE USING (id = auth.uid());
CREATE POLICY "admin/support can select profiles" ON public.profiles FOR SELECT USING (public.is_admin_or_support());

-- businesses
CREATE POLICY "anyone authenticated can select active businesses" ON public.businesses FOR SELECT USING (auth.role() = 'authenticated' AND is_active = true);
CREATE POLICY "admin/support can manage businesses" ON public.businesses USING (public.is_admin_or_support());

-- business_settings
CREATE POLICY "anyone authenticated can select settings for active businesses" ON public.business_settings FOR SELECT USING (
  auth.role() = 'authenticated' AND business_id IN (SELECT id FROM public.businesses WHERE is_active = true)
);
CREATE POLICY "admin/support can manage settings" ON public.business_settings USING (public.is_admin_or_support());

-- products
CREATE POLICY "anyone authenticated can select available products from active businesses" ON public.products FOR SELECT USING (
  auth.role() = 'authenticated' AND is_available = true AND business_id IN (SELECT id FROM public.businesses WHERE is_active = true)
);
CREATE POLICY "admin/support can manage products" ON public.products USING (public.is_admin_or_support());

-- carts
CREATE POLICY "user can select own carts" ON public.carts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user can insert own carts" ON public.carts FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user can update own active carts" ON public.carts FOR UPDATE USING (user_id = auth.uid() AND status = 'active');
CREATE POLICY "user can delete own active carts" ON public.carts FOR DELETE USING (user_id = auth.uid() AND status = 'active');
CREATE POLICY "admin/support can select carts" ON public.carts FOR SELECT USING (public.is_admin_or_support());

-- cart_items
CREATE POLICY "user can select items from own carts" ON public.cart_items FOR SELECT USING (
  cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
);
CREATE POLICY "user can insert into own carts" ON public.cart_items FOR INSERT WITH CHECK (
  cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid())
);
CREATE POLICY "user can update items from own active carts" ON public.cart_items FOR UPDATE USING (
  cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid() AND status = 'active')
);
CREATE POLICY "user can delete items from own active carts" ON public.cart_items FOR DELETE USING (
  cart_id IN (SELECT id FROM public.carts WHERE user_id = auth.uid() AND status = 'active')
);

-- orders
CREATE POLICY "user can select own orders" ON public.orders FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user can insert own orders" ON public.orders FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "admin/support can select/manage orders" ON public.orders USING (public.is_admin_or_support());

-- order_items
CREATE POLICY "user can select items from own orders" ON public.order_items FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);
CREATE POLICY "admin/support can select/manage order_items" ON public.order_items USING (public.is_admin_or_support());

-- payments
CREATE POLICY "user can select payments for own orders" ON public.payments FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);
CREATE POLICY "admin/support can select/manage payments" ON public.payments USING (public.is_admin_or_support());

-- deliveries
CREATE POLICY "user can select delivery for own orders" ON public.deliveries FOR SELECT USING (
  order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
);
CREATE POLICY "rider can select deliveries assigned to them" ON public.deliveries FOR SELECT USING (rider_id = auth.uid());
CREATE POLICY "admin/support can manage deliveries" ON public.deliveries USING (public.is_admin_or_support());

-- support_tickets
CREATE POLICY "user can select own tickets" ON public.support_tickets FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user can insert own tickets" ON public.support_tickets FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user can update own tickets only if status is open" ON public.support_tickets FOR UPDATE USING (user_id = auth.uid() AND status = 'open');
CREATE POLICY "admin/support can manage tickets" ON public.support_tickets USING (public.is_admin_or_support());

-- chat_sessions
CREATE POLICY "user can select own sessions" ON public.chat_sessions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "user can insert own sessions" ON public.chat_sessions FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "user can update own sessions" ON public.chat_sessions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "admin/support can select sessions" ON public.chat_sessions FOR SELECT USING (public.is_admin_or_support());

-- chat_messages
CREATE POLICY "user can select messages from own sessions" ON public.chat_messages FOR SELECT USING (
  session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "user can insert messages into own sessions" ON public.chat_messages FOR INSERT WITH CHECK (
  session_id IN (SELECT id FROM public.chat_sessions WHERE user_id = auth.uid())
);
CREATE POLICY "admin/support can select messages" ON public.chat_messages FOR SELECT USING (public.is_admin_or_support());

-- knowledge_base
CREATE POLICY "authenticated users can select active knowledge base for active businesses" ON public.knowledge_base FOR SELECT USING (
  auth.role() = 'authenticated' AND is_active = true AND business_id IN (SELECT id FROM public.businesses WHERE is_active = true)
);
CREATE POLICY "admin/support can manage knowledge base" ON public.knowledge_base USING (public.is_admin_or_support());

-- ai_interactions
CREATE POLICY "user can select own AI logs if needed, or restrict to admin/support only" ON public.ai_interactions FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "admin/support can select ai interactions" ON public.ai_interactions FOR SELECT USING (public.is_admin_or_support());
