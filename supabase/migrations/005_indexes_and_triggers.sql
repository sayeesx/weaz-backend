-- Indexes
CREATE INDEX profiles_phone_idx ON public.profiles(phone);
CREATE INDEX businesses_slug_idx ON public.businesses(slug);
CREATE INDEX products_business_id_idx ON public.products(business_id);
CREATE INDEX products_category_idx ON public.products(category);
CREATE INDEX products_name_idx ON public.products(name);
CREATE INDEX carts_user_id_business_id_status_idx ON public.carts(user_id, business_id, status);
CREATE INDEX orders_user_id_created_at_idx ON public.orders(user_id, created_at DESC);
CREATE INDEX orders_order_number_idx ON public.orders(order_number);
CREATE INDEX chat_sessions_user_id_last_message_at_idx ON public.chat_sessions(user_id, last_message_at DESC);
CREATE INDEX chat_messages_session_id_created_at_idx ON public.chat_messages(session_id, created_at);
CREATE INDEX knowledge_base_business_id_category_idx ON public.knowledge_base(business_id, category);
CREATE INDEX support_tickets_user_id_created_at_idx ON public.support_tickets(user_id, created_at DESC);
CREATE INDEX ai_interactions_session_id_created_at_idx ON public.ai_interactions(session_id, created_at DESC);

-- Triggers for updated_at
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_businesses_updated_at BEFORE UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_business_settings_updated_at BEFORE UPDATE ON public.business_settings FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_carts_updated_at BEFORE UPDATE ON public.carts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_orders_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_payments_updated_at BEFORE UPDATE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_deliveries_updated_at BEFORE UPDATE ON public.deliveries FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_support_tickets_updated_at BEFORE UPDATE ON public.support_tickets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_chat_sessions_updated_at BEFORE UPDATE ON public.chat_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER set_knowledge_base_updated_at BEFORE UPDATE ON public.knowledge_base FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
