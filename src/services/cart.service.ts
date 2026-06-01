import { createSupabaseUserClient, supabaseAdmin } from '../config/supabase';
import { AppError, NotFoundError } from '../utils/errors';
import { WEAZ_BUSINESS, WEAZ_BUSINESS_ID } from '../config/weaz';

export class CartService {
  /** Get active cart for user */
  static async getActiveCart(token: string, userId: string) {
    const supabase = createSupabaseUserClient(token);

    const { data: cart } = await supabase
      .from('carts')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .limit(1)
      .single();

    if (cart) {
      const { data: items } = await supabase
        .from('cart_items')
        .select('*')
        .eq('cart_id', cart.id);
      
      return { ...cart, items: items || [] };
    }

    // Create new cart
    const { data: newCart, error } = await supabase
      .from('carts')
      .insert({ 
        user_id: userId,
        business_id: WEAZ_BUSINESS_ID,
        status: 'active',
        subtotal: 0,
        delivery_fee: WEAZ_BUSINESS.deliveryFee,
        total: WEAZ_BUSINESS.deliveryFee
      })
      .select()
      .single();

    if (error) throw new AppError('Failed to create cart', 'DB_ERROR');
    return { ...newCart, items: [] };
  }

  /** Calculate cart totals directly in backend */
  static async recalculateCart(cartId: string) {
    const { data: items } = await supabaseAdmin
      .from('cart_items')
      .select('line_total')
      .eq('cart_id', cartId);
    
    let subtotal = 0;
    if (items) {
      subtotal = items.reduce((acc, item) => acc + Number(item.line_total), 0);
    }
    
    const delivery_fee = subtotal >= WEAZ_BUSINESS.freeDeliveryAbove ? 0 : WEAZ_BUSINESS.deliveryFee;
    const total = subtotal + delivery_fee;

    await supabaseAdmin
      .from('carts')
      .update({ subtotal, delivery_fee, total, updated_at: new Date().toISOString() })
      .eq('id', cartId);
  }

  /** Add item to cart */
  static async addItem(token: string, userId: string, productId: string, quantity: number) {
    const cart = await this.getActiveCart(token, userId);
    const supabase = createSupabaseUserClient(token);
    
    // Verify product exists and get price
    const { data: product } = await supabaseAdmin
      .from('products')
      .select('price')
      .eq('id', productId)
      .single();
      
    if (!product) throw new NotFoundError('Product not found');

    const unitPrice = Number(product.price);
    
    const { data: existingItem } = await supabase
      .from('cart_items')
      .select('*')
      .eq('cart_id', cart.id)
      .eq('product_id', productId)
      .single();

    if (existingItem) {
      const newQty = existingItem.quantity + quantity;
      await supabase
        .from('cart_items')
        .update({
          quantity: newQty,
          unit_price: unitPrice,
          line_total: newQty * unitPrice
        })
        .eq('id', existingItem.id);
    } else {
      await supabase
        .from('cart_items')
        .insert({
          cart_id: cart.id,
          product_id: productId,
          quantity,
          unit_price: unitPrice,
          line_total: quantity * unitPrice
        });
    }

    await this.recalculateCart(cart.id);
    return this.getActiveCart(token, userId);
  }

  /** Remove item from cart */
  static async removeItem(token: string, userId: string, itemId: string) {
    const supabase = createSupabaseUserClient(token);
    const { data: item } = await supabase
      .from('cart_items')
      .select('cart_id')
      .eq('id', itemId)
      .single();
      
    if (!item) return;

    await supabase.from('cart_items').delete().eq('id', itemId);
    await this.recalculateCart(item.cart_id);
    return true;
  }
}
