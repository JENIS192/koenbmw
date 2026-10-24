(async function () {
  await App.ready;
  const root = document.getElementById('detail-root');
  const id = Number(App.qs('id'));
  if (!id) { root.innerHTML = '<div class="empty" style="margin:40px 0"><h3>No vehicle selected</h3><a class="btn" href="/vehicles.html">Browse vehicles</a></div>'; return; }

  let data;
  try {
    data = await App.api('/vehicles/' + id);
  } catch (e) {
    root.innerHTML = `<div class="empty" style="margin:40px 0"><h3>${App.esc(e.message)}</h3><a class="btn" href="/vehicles.html">Browse vehicles</a></div>`;
    return;
  }
  const v = data.vehicle;
  document.title = `${v.brand} ${v.model} | ${App.APP_NAME}`;
  const images = data.images.length ? data.images : [{ id: 0, image_path: null }];
  const wished = App.wishIds.has(v.id);
  const user = App.user();
  const sold = v.status === 'sold';

  const specRow = (k, val) => (val === null || val === undefined || val === '' ? '' : `<tr><th>${k}</th><td>${App.esc(val)}</td></tr>`);

  root.innerHTML = `
    <div class="crumbs" style="margin-top:22px"><a href="/">Home</a> / <a href="/vehicles.html?department=${encodeURIComponent(v.department_slug)}">${App.esc(v.department_name)}</a> / ${App.esc(v.brand)} ${App.esc(v.model)}</div>
    <div class="detail">
      <div>
        <div class="gallery-main"><img id="main-img" src="${App.img(images[0].image_path)}" alt="${App.esc(v.brand + ' ' + v.model)}"></div>
        <div class="thumbs">${images.map((im, i) => `<button type="button" class="${i === 0 ? 'on' : ''}" data-src="${App.img(im.image_path)}" aria-label="Photo ${i + 1}"><img src="${App.img(im.image_path)}" alt=""></button>`).join('')}</div>
        <div class="specs">
          <div class="spec"><strong>${v.horsepower ? v.horsepower + ' hp' : '-'}</strong><span>Power</span></div>
          <div class="spec"><strong>${v.top_speed ? v.top_speed + ' km/h' : '-'}</strong><span>Top speed</span></div>
          <div class="spec"><strong>${v.acceleration ? v.acceleration + ' s' : '-'}</strong><span>0 to 100 km/h</span></div>
          <div class="spec"><strong>${Number(v.mileage).toLocaleString()} km</strong><span>Mileage</span></div>
        </div>
      </div>
      <aside class="buybox">
        <span class="pill ${v.status}">${v.status}</span>
        <h1 style="margin-top:12px">${App.esc(v.brand)} ${App.esc(v.model)}</h1>
        <div class="muted">${v.year} | ${App.esc(v.color || '')} ${v.rating ? ' | <span class="stars">' + App.stars(v.rating) + '</span> (' + v.review_count + ')' : ''}</div>
        <span class="price">${App.money(v.price)}</span>
        <div class="btn-row">
          <button class="btn" id="add-cart" type="button" ${sold ? 'disabled' : ''}>${sold ? 'Sold' : 'Add to cart'}</button>
          <button class="btn btn-ghost" id="wish" type="button">${wished ? '♥ Saved' : '♡ Save'}</button>
        </div>
        <div class="btn-row"><button class="btn btn-ghost btn-block" id="td-btn" type="button">Book a test drive</button></div>
        <p class="muted" style="margin:16px 0 0;font-size:.88rem">Delivery is insured and enclosed. Cancel any time while the order is pending.</p>
      </aside>
    </div>

    <div class="tabs" id="dtabs"><button class="on" data-t="overview">Overview</button><button data-t="specs">Specifications</button><button data-t="reviews">Reviews (${data.reviews.length})</button></div>
    <div id="t-overview" class="card"><p style="margin:0">${App.esc(v.description || 'Contact our team for the full vehicle history and inspection report.')}</p></div>
    <div id="t-specs" class="card hidden"><table class="table-simple">
      ${specRow('Department', v.department_name)}${specRow('Brand', v.brand)}${specRow('Model', v.model)}${specRow('Year', v.year)}${specRow('Colour', v.color)}
      ${specRow('Fuel', v.fuel)}${specRow('Transmission', v.transmission)}${specRow('Power', v.horsepower ? v.horsepower + ' hp' : '')}
      ${specRow('Top speed', v.top_speed ? v.top_speed + ' km/h' : '')}${specRow('0 to 100 km/h', v.acceleration ? v.acceleration + ' seconds' : '')}${specRow('Mileage', Number(v.mileage).toLocaleString() + ' km')}</table></div>
    <div id="t-reviews" class="card hidden">
      ${data.reviews.length ? data.reviews.map((r) => `<div class="review"><div><strong>${App.esc(r.name)}</strong> <span class="stars">${App.stars(r.rating)}</span> <span class="muted" style="font-size:.82rem">${App.date(r.created_at)}</span></div><p style="margin:6px 0 0">${App.esc(r.comment || '')}</p></div>`).join('') : '<p class="muted">No reviews yet. Be the first to share your impressions.</p>'}
      <form id="review-form" style="margin-top:20px;border-top:1px solid var(--line);padding-top:18px">
        <h3>Write a review</h3><div class="form-msg" id="rv-msg"></div>
        <div class="grid-2"><div class="field"><label for="rv-rating">Rating</label><select id="rv-rating"><option value="5">5 stars</option><option value="4">4 stars</option><option value="3">3 stars</option><option value="2">2 stars</option><option value="1">1 star</option></select></div></div>
        <div class="field"><label for="rv-comment">Comment</label><textarea id="rv-comment" maxlength="800"></textarea></div>
        <button class="btn" type="submit">Post review</button>
      </form>
    </div>

    ${data.related.length ? `<div class="section" style="padding-bottom:20px"><div class="section-head"><h2 style="font-size:1.5rem">More from ${App.esc(v.department_name)}</h2></div><div class="car-grid">${data.related.map(App.carCard).join('')}</div></div>` : ''}`;

  App.bindCards(root);
  root.querySelectorAll('.thumbs button').forEach((b) => b.addEventListener('click', () => {
    document.getElementById('main-img').src = b.dataset.src;
    root.querySelectorAll('.thumbs button').forEach((x) => x.classList.toggle('on', x === b));
  }));
  root.querySelectorAll('#dtabs button').forEach((b) => b.addEventListener('click', () => {
    root.querySelectorAll('#dtabs button').forEach((x) => x.classList.toggle('on', x === b));
    ['overview', 'specs', 'reviews'].forEach((t) => document.getElementById('t-' + t).classList.toggle('hidden', t !== b.dataset.t));
  }));

  document.getElementById('add-cart').addEventListener('click', () => App.addToCart(v.id));
  const wishBtn = document.getElementById('wish');
  wishBtn.addEventListener('click', async () => {
    await App.toggleWish(v.id, null);
    wishBtn.textContent = App.wishIds.has(v.id) ? '♥ Saved' : '♡ Save';
  });

  document.getElementById('td-btn').addEventListener('click', () => {
    const m = App.modal('Book a test drive: ' + v.brand + ' ' + v.model, `
      <form id="td-form" novalidate><div class="form-msg" id="td-msg"></div>
        <div class="grid-2"><div class="field"><label for="td-name">Name</label><input id="td-name" required value="${App.esc(user ? user.name : '')}"></div>
        <div class="field"><label for="td-email">Email</label><input id="td-email" type="email" required value="${App.esc(user ? user.email : '')}"></div></div>
        <div class="grid-2"><div class="field"><label for="td-phone">Phone</label><input id="td-phone" value="${App.esc(user && user.phone ? user.phone : '')}"></div>
        <div class="field"><label for="td-date">Preferred date</label><input id="td-date" type="date"></div></div>
        <div class="field"><label for="td-msg-text">Message</label><textarea id="td-msg-text">I would like to test drive the ${App.esc(v.year + ' ' + v.brand + ' ' + v.model)}.</textarea></div>
        <button class="btn" type="submit">Request test drive</button></form>`);
    m.el.querySelector('#td-form').addEventListener('submit', async (e) => {
      e.preventDefault();
      const msg = m.el.querySelector('#td-msg');
      try {
        const r = await App.api('/inquiries', { method: 'POST', body: {
          type: 'test_drive', vehicle_id: v.id,
          name: m.el.querySelector('#td-name').value, email: m.el.querySelector('#td-email').value,
          phone: m.el.querySelector('#td-phone').value, preferred_date: m.el.querySelector('#td-date').value,
          message: m.el.querySelector('#td-msg-text').value,
        } });
        App.toast(r.message, 'ok');
        m.close();
      } catch (err) { App.showMsg(msg, 'error', err.message); }
    });
  });

  document.getElementById('review-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!App.requireLogin()) return;
    const msg = document.getElementById('rv-msg');
    try {
      await App.api('/vehicles/' + v.id + '/reviews', { method: 'POST', body: { rating: document.getElementById('rv-rating').value, comment: document.getElementById('rv-comment').value } });
      location.reload();
    } catch (err) { App.showMsg(msg, 'error', err.message); }
  });
})();
