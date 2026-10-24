(async function () {
  await App.ready;
  if (!App.requireLogin()) return;
  const list = document.getElementById('cart-list');
  const summary = document.getElementById('cart-summary');

  async function load() {
    try {
      const d = await App.api('/cart');
      render(d);
    } catch (e) {
      list.innerHTML = `<p>${App.esc(e.message)}</p>`;
    }
  }

  function render(d) {
    App.refreshCartCount();
    if (!d.items.length) {
      list.innerHTML = '<div class="empty"><h3>Your cart is empty</h3><p>Find your next car in one of our departments.</p><a class="btn" href="/vehicles.html">Browse vehicles</a></div>';
      summary.innerHTML = '<p class="muted">Nothing to pay yet.</p>';
      return;
    }
    list.innerHTML = d.items.map((i) => `
      <div class="row-item">
        <a href="/vehicle.html?id=${i.vehicle_id}"><img src="${App.img(i.image)}" alt=""></a>
        <div><h3 style="margin:0"><a href="/vehicle.html?id=${i.vehicle_id}" style="color:inherit">${i.year} ${App.esc(i.brand)} ${App.esc(i.model)}</a></h3>
          <div class="muted" style="font-size:.88rem">${App.esc(i.color || '')} ${i.status === 'sold' ? '<span class="pill sold">No longer available</span>' : ''}</div></div>
        <div style="text-align:right"><div class="price">${App.money(i.price)}</div><button class="btn btn-ghost btn-sm" data-remove="${i.vehicle_id}" type="button" style="margin-top:6px">Remove</button></div>
      </div>`).join('');
    const hasSold = d.items.some((i) => i.status !== 'available');
    summary.innerHTML = `
      <div class="summary-line"><span>Vehicles (${d.items.length})</span><span>${App.money(d.total)}</span></div>
      <div class="summary-line"><span>Insured delivery</span><span>Included</span></div>
      <div class="summary-line summary-total"><span>Total</span><span>${App.money(d.total)}</span></div>
      ${hasSold ? '<p class="muted" style="font-size:.88rem">Remove unavailable vehicles to continue.</p>' : ''}
      <a class="btn btn-block" href="/checkout.html" style="margin-top:14px;${hasSold ? 'pointer-events:none;opacity:.5' : ''}">Continue to checkout</a>
      <button class="btn btn-ghost btn-block" id="clear-cart" type="button" style="margin-top:8px">Clear cart</button>`;
    list.querySelectorAll('[data-remove]').forEach((b) => b.addEventListener('click', async () => {
      try { render(await App.api('/cart/' + b.dataset.remove, { method: 'DELETE' })); } catch (e) { App.toast(e.message, 'error'); }
    }));
    document.getElementById('clear-cart').addEventListener('click', async () => {
      try { render(await App.api('/cart', { method: 'DELETE' })); } catch (e) { App.toast(e.message, 'error'); }
    });
  }
  load();
})();
