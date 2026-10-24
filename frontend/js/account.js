(async function () {
  await App.ready;
  if (!App.requireLogin()) return;
  const $ = (id) => document.getElementById(id);
  const typeName = { test_drive: 'Test drive', enquiry: 'Enquiry', sell_car: 'Sell my car' };
  const payName = { card: 'Card', bank_transfer: 'Bank transfer', finance: 'Finance', pay_on_delivery: 'Pay on delivery' };

  let me;
  try {
    me = (await App.api('/auth/me')).user;
    App.setSession(App.token(), me);
  } catch (e) { location.href = '/login.html?next=/account.html'; return; }
  $('acc-sub').textContent = `${me.name} | ${me.email}`;
  $('p-name').value = me.name; $('p-email').value = me.email; $('p-phone').value = me.phone || '';

  document.querySelectorAll('#acc-tabs button').forEach((b) => b.addEventListener('click', () => {
    document.querySelectorAll('#acc-tabs button').forEach((x) => x.classList.toggle('on', x === b));
    ['orders', 'inquiries', 'profile'].forEach((t) => $('tab-' + t).classList.toggle('hidden', t !== b.dataset.tab));
  }));

  async function loadOrders() {
    const box = $('tab-orders');
    try {
      const { orders } = await App.api('/orders');
      if (!orders.length) { box.innerHTML = '<div class="empty"><h3>No orders yet</h3><p>Your orders will appear here.</p><a class="btn" href="/vehicles.html">Browse vehicles</a></div>'; return; }
      box.innerHTML = orders.map((o) => `
        <div class="card" style="margin-bottom:16px">
          <div style="display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:12px">
            <div><strong>${App.esc(o.order_number)}</strong><div class="muted" style="font-size:.86rem">${App.date(o.created_at)} | ${App.esc(payName[o.payment_method] || o.payment_method)}</div></div>
            <div style="text-align:right"><span class="pill ${o.status}">${o.status}</span><div class="price" style="font-size:1.1rem;margin-top:4px">${App.money(o.total)}</div></div>
          </div>
          ${o.items.map((i) => `<div class="row-item" style="padding:10px 0"><img src="${App.img(i.image)}" alt=""><div><a href="/vehicle.html?id=${i.vehicle_id}">${App.esc(i.vehicle_name)}</a></div><div>${App.money(i.price)}</div></div>`).join('')}
          <div class="muted" style="font-size:.88rem">Delivery to ${App.esc(o.shipping_name)}, ${App.esc(o.shipping_address)}, ${App.esc(o.shipping_city)}, ${App.esc(o.shipping_country)}</div>
          ${o.status === 'pending' ? `<button class="btn btn-ghost btn-sm" data-cancel="${o.id}" type="button" style="margin-top:10px">Cancel order</button>` : ''}
        </div>`).join('');
      box.querySelectorAll('[data-cancel]').forEach((b) => b.addEventListener('click', async () => {
        if (!confirm('Cancel this order? The vehicle will be released.')) return;
        try { await App.api('/orders/' + b.dataset.cancel + '/cancel', { method: 'POST' }); App.toast('Order cancelled', 'ok'); loadOrders(); } catch (e) { App.toast(e.message, 'error'); }
      }));
    } catch (e) { box.innerHTML = `<div class="empty">${App.esc(e.message)}</div>`; }
  }

  async function loadInquiries() {
    const box = $('tab-inquiries');
    try {
      const { inquiries } = await App.api('/inquiries/mine');
      box.innerHTML = inquiries.length
        ? `<div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>Type</th><th>Vehicle</th><th>Message</th><th>Status</th></tr></thead><tbody>${inquiries.map((i) => `<tr><td>${App.date(i.created_at)}</td><td>${typeName[i.type]}</td><td>${App.esc(i.vehicle_name || '-')}</td><td>${App.esc(i.message)}</td><td><span class="pill ${i.status}">${i.status}</span></td></tr>`).join('')}</tbody></table></div>`
        : '<div class="empty"><h3>No test drives or enquiries yet</h3><a class="btn" href="/contact.html">Contact our team</a></div>';
    } catch (e) { box.innerHTML = `<div class="empty">${App.esc(e.message)}</div>`; }
  }

  $('profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      const d = await App.api('/auth/me', { method: 'PUT', body: { name: $('p-name').value, phone: $('p-phone').value } });
      App.setSession(App.token(), d.user);
      App.showMsg($('pf-msg'), 'ok', 'Profile saved');
    } catch (err) { App.showMsg($('pf-msg'), 'error', err.message); }
  });
  $('pw-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await App.api('/auth/password', { method: 'PUT', body: { current_password: $('pw-cur').value, new_password: $('pw-new').value } });
      App.showMsg($('pw-msg'), 'ok', 'Password updated');
      $('pw-form').reset();
    } catch (err) { App.showMsg($('pw-msg'), 'error', err.message); }
  });

  loadOrders();
  loadInquiries();
})();
