import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
const API = 'http://localhost:8081';

async function runTests() {
  console.log('--- 7. Razorpay negative test ---');
  let authRes = await fetch(`${API}/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ razorpay_order_id: 'test', razorpay_payment_id: 'test', razorpay_signature: 'test' })
  });
  console.log('Verify Status without token:', authRes.status);
  let authJson = await authRes.json();
  console.log('Verify Response without token:', authJson);

  // We need auth token. Let's create a dummy user
  const email = `test_${Date.now()}@weaz.ai`;
  const { data: authData } = await supabase.auth.admin.createUser({
    email,
    password: 'password123',
    email_confirm: true
  });
  const { data: loginData } = await supabase.auth.signInWithPassword({
    email,
    password: 'password123'
  });
  const token = loginData?.session?.access_token;
  if (!token) throw new Error('Auth failed');

  console.log('\n--- 9. Auth proof ---');
  let p1 = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer ${token}` } });
  console.log('Auth valid token status:', p1.status);
  let p2 = await fetch(`${API}/auth/me`, { headers: { 'Authorization': `Bearer invalid` } });
  console.log('Auth invalid token status:', p2.status);
  let p3 = await fetch(`${API}/auth/me`);
  console.log('Auth no token status:', p3.status);

  console.log('\n--- 7. Razorpay negative test (with auth) ---');
  let nTest = await fetch(`${API}/payments/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ razorpay_order_id: 'test', razorpay_payment_id: 'test', razorpay_signature: 'test' })
  });
  console.log('Razorpay verify invalid sig status:', nTest.status);
  let nTestJson = await nTest.json();
  console.log('Razorpay verify invalid sig response:', nTestJson);

  console.log('\n--- 8. Razorpay positive test (unit simulation) ---');
  // I'll test creating an order
  let cCart = await fetch(`${API}/cart/items`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
    body: JSON.stringify({ productId: 'invalid', quantity: 1 })
  });
  // Since products schema in this DB has 'name', when backend does '...products(title)', it will fail or not.
  // Actually, I just need the cart to exist
  let cartRes = await fetch(`${API}/cart`, { headers: { 'Authorization': `Bearer ${token}` } });
  console.log('Cart fetch:', await cartRes.json());
  
  let checkout = await fetch(`${API}/orders/checkout`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  console.log('Checkout response:', await checkout.json());

  console.log('\n--- 11. AI Scope proof ---');
  let aiTests = [
     "who is the prime minister",
     "onion price ethra",
     "2 kg savala and 1 paal packet venam"
  ];
  let sessionCreator = await fetch(`${API}/chat/sessions`, { method: 'POST', headers: { 'Authorization': `Bearer ${token}` } });
  let sessionData = await sessionCreator.json();
  let sessId = sessionData.data?.id;
  if (sessId) {
    for (let msg of aiTests) {
       console.log(`\nAI Query: ${msg}`);
       let ai = await fetch(`${API}/chat/sessions/${sessId}/messages`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
         body: JSON.stringify({ message: msg })
       });
       let aiJson = await ai.json();
       console.log('Response content:', aiJson?.data?.assistant_message?.content || aiJson);
    }
  }

  console.log('\n--- 15. CORS proof ---');
  // I will make an options request with an origin
  let cors = await fetch(`${API}/health`, {
    method: 'OPTIONS',
    headers: { 'Origin': 'http://bad-hacker-site.com' }
  });
  console.log('CORS Bad Origin Status:', cors.status);
  console.log('CORS ACAO Header:', cors.headers.get('access-control-allow-origin'));

  // Clean up
  if (authData?.user) {
    await supabase.auth.admin.deleteUser(authData.user.id);
  }
}

runTests().catch(console.error);
