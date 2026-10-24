(async function () {
  await App.ready;
  if (!App.requireLogin()) return;
  const $ = (id) => document.getElementById(id);
  const user = App.user();
  if (user) { $('c-name').value = user.name || ''; $('c-phone').value = user.phone || ''; }

  let cart;
  try {
    cart = await App.api('/cart');
  } catch (e) {
    $('co-summary').innerHTML = `<p>${App.esc(e.message)}</p>`;
    return;
  }
  if (!cart.items.length) {
    $('checkout-root').innerHTML = '<div class="empty" style="grid-column:1/-1"><h3>Your cart is empty</h3><a class="btn" href="/vehicles.html">Browse vehicles</a></div>';
    return;
  }
  $('co-summary').innerHTML = cart.items.map((i) => `<div class="summary-line"><span>${i.year} ${App.esc(i.brand)} ${App.esc(i.model)}</span><span>${App.money(i.price)}</span></div>`).join('')
    + `<div class="summary-line summary-total"><span>Total</span><span>${App.money(cart.total)}</span></div>`;

  $('checkout-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = $('place-btn');
    const msg = $('co-msg');
    btn.disabled = true;
    btn.textContent = 'Placing order...';
    try {
      const r = await App.api('/orders', { method: 'POST', body: {
        shipping_name: $('c-name').value, shipping_phone: $('c-phone').value, shipping_address: $('c-address').value,
        shipping_city: $('c-city').value, shipping_country: $('c-country').value,
        payment_method: document.querySelector('input[name=pay]:checked').value, notes: $('c-notes').value,
      } });
      $('checkout-root').innerHTML = `<div class="card" style="grid-column:1/-1;text-align:center;padding:50px 20px">
        <span class="mstripe" style="margin-bottom:14px"><i></i><i></i><i></i></span>
        <h2>Order placed</h2><p class="muted">Your order number is <strong style="color:var(--text)">${App.esc(r.order_number)}</strong> for ${App.money(r.total)}.<br>Our team will confirm it shortly.</p>
        <a class="btn" href="/account.html">View my orders</a> <a class="btn btn-ghost" href="/vehicles.html">Keep browsing</a></div>`;
      App.refreshCartCount();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      App.showMsg(msg, 'error', err.message);
      btn.disabled = false;
      btn.textContent = 'Place order';
    }
  });
})();
