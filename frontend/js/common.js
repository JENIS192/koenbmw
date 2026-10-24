/* Shared helpers: API client, auth session, navigation, footer, cards, toasts */
(function () {
  const cfg = window.APP_CONFIG || {};
  const APP_NAME = cfg.APP_NAME || 'Apex & Bavaria Motors';
  const API = (cfg.API_BASE_URL || '') + '/api';
  const money = new Intl.NumberFormat(cfg.LOCALE || 'en-US', { style: 'currency', currency: cfg.CURRENCY || 'USD', maximumFractionDigits: 0 });

  const App = {
    APP_NAME,
    money: (n) => money.format(Number(n) || 0),
    esc(v) {
      return String(v === null || v === undefined ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    },
    qs: (name) => new URLSearchParams(location.search).get(name),
    date: (d) => new Date(d).toLocaleDateString(cfg.LOCALE || 'en-US', { year: 'numeric', month: 'short', day: 'numeric' }),
    img: (p) => (p ? (cfg.API_BASE_URL || '') + p : 'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 500"><rect width="800" height="500" fill="#1c242e"/><text x="400" y="260" fill="#93a1b0" font-family="Arial" font-size="28" text-anchor="middle">No photo yet</text></svg>')),
    token: () => localStorage.getItem('ab_token'),
    user() {
      try { return JSON.parse(localStorage.getItem('ab_user') || 'null'); } catch (e) { return null; }
    },
    setSession(token, user) {
      localStorage.setItem('ab_token', token);
      localStorage.setItem('ab_user', JSON.stringify(user));
    },
    logout() {
      localStorage.removeItem('ab_token');
      localStorage.removeItem('ab_user');
      location.href = '/';
    },
    requireLogin() {
      if (!App.token()) {
        location.href = '/login.html?next=' + encodeURIComponent(location.pathname + location.search);
        return false;
      }
      return true;
    },
    async api(path, opts = {}) {
      const headers = {};
      const token = App.token();
      if (token) headers.Authorization = 'Bearer ' + token;
      let body = opts.body;
      if (body && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
      }
      let res;
      try {
        res = await fetch(API + path, { method: opts.method || 'GET', headers, body });
      } catch (e) {
        throw new Error('Cannot reach the server. Check that the backend is running.');
      }
      let data = {};
      try { data = await res.json(); } catch (e) { data = {}; }
      if (res.status === 401 && token) {
        localStorage.removeItem('ab_token');
        localStorage.removeItem('ab_user');
      }
      if (!res.ok) {
        const err = new Error(data.message || 'Request failed');
        err.status = res.status;
        throw err;
      }
      return data;
    },
    toast(message, type) {
      let box = document.querySelector('.toasts');
      if (!box) {
        box = document.createElement('div');
        box.className = 'toasts';
        box.setAttribute('aria-live', 'polite');
        document.body.appendChild(box);
      }
      const t = document.createElement('div');
      t.className = 'toast ' + (type || '');
      t.textContent = message;
      box.appendChild(t);
      setTimeout(() => t.remove(), 3800);
    },
    stars(r) {
      const n = Math.round(Number(r) || 0);
      return '★'.repeat(n) + '☆'.repeat(5 - n);
    },
    wishIds: new Set(),
    async loadWishIds() {
      if (!App.token()) return;
      try {
        const d = await App.api('/wishlist/ids');
        App.wishIds = new Set(d.ids);
      } catch (e) { /* ignore */ }
    },
    async refreshCartCount() {
      const el = document.getElementById('cart-count');
      if (!el) return;
      if (!App.token()) { el.textContent = '0'; return; }
      try {
        const d = await App.api('/cart');
        el.textContent = d.count;
      } catch (e) { el.textContent = '0'; }
    },
    async addToCart(id) {
      if (!App.requireLogin()) return false;
      try {
        await App.api('/cart/' + id, { method: 'POST' });
        App.toast('Added to your cart', 'ok');
        App.refreshCartCount();
        return true;
      } catch (e) {
        App.toast(e.message, 'error');
        return false;
      }
    },
    async toggleWish(id, btn) {
      if (!App.requireLogin()) return;
      try {
        const d = await App.api('/wishlist/' + id, { method: 'POST' });
        if (d.wished) App.wishIds.add(id); else App.wishIds.delete(id);
        if (btn) { btn.classList.toggle('on', d.wished); btn.textContent = d.wished ? '♥' : '♡'; }
        App.toast(d.wished ? 'Saved to your wishlist' : 'Removed from your wishlist');
      } catch (e) {
        App.toast(e.message, 'error');
      }
    },
    carCard(v) {
      const wished = App.wishIds.has(v.id);
      const soldTag = v.status === 'sold' ? '<span class="tag sold">Sold</span>' : v.featured ? '<span class="tag feat">Featured</span>' : `<span class="tag">${App.esc(v.department_name || v.brand)}</span>`;
      const specs = [
        v.year,
        v.horsepower ? v.horsepower + ' hp' : null,
        v.fuel ? App.esc(String(v.fuel).split(' (')[0]) : null,
        v.mileage !== undefined && v.mileage !== null ? Number(v.mileage).toLocaleString() + ' km' : null,
      ].filter(Boolean).map((s) => `<span>${s}</span>`).join('');
      const rating = v.rating ? `<span class="stars" title="${v.rating} out of 5">${App.stars(v.rating)}</span>` : '';
      return `<article class="car-card">
        <div class="car-thumb">
          <a href="/vehicle.html?id=${v.id}"><img src="${App.img(v.image)}" alt="${App.esc(v.brand + ' ' + v.model)}" loading="lazy"></a>
          ${soldTag}
          <button class="wish-btn ${wished ? 'on' : ''}" data-wish="${v.id}" aria-label="Save to wishlist">${wished ? '♥' : '♡'}</button>
        </div>
        <div class="car-body">
          <h3><a href="/vehicle.html?id=${v.id}" style="color:inherit">${App.esc(v.brand)} ${App.esc(v.model)}</a></h3>
          <p class="car-sub">${App.esc(v.color || '')} ${rating}</p>
          <div class="car-specs">${specs}</div>
          <div class="car-foot">
            <span class="price">${App.money(v.price)}</span>
            <a class="btn btn-sm btn-ghost" href="/vehicle.html?id=${v.id}">View details</a>
          </div>
        </div>
      </article>`;
    },
    bindCards(root) {
      (root || document).querySelectorAll('[data-wish]').forEach((b) => {
        if (b.dataset.bound) return;
        b.dataset.bound = '1';
        b.addEventListener('click', () => App.toggleWish(Number(b.dataset.wish), b));
      });
    },
    modal(title, html) {
      const back = document.createElement('div');
      back.className = 'modal-back';
      back.innerHTML = `<div class="modal" role="dialog" aria-modal="true"><div class="modal-head"><h3>${App.esc(title)}</h3><button class="x-btn" aria-label="Close">&times;</button></div><div class="modal-content">${html}</div></div>`;
      const close = () => back.remove();
      back.querySelector('.x-btn').addEventListener('click', close);
      back.addEventListener('mousedown', (e) => { if (e.target === back) close(); });
      document.addEventListener('keydown', function esc(e) {
        if (e.key === 'Escape') { close(); document.removeEventListener('keydown', esc); }
      });
      document.body.appendChild(back);
      return { el: back, close };
    },
    showMsg(el, type, text) {
      el.className = 'form-msg ' + type;
      el.textContent = text;
    },
  };

  function renderNav(departments) {
    const user = App.user();
    const path = location.pathname;
    const active = (p) => (path === p || (p === '/' && path === '/index.html') ? 'active' : '');
    const deptLinks = departments.map((d) => `<a href="/vehicles.html?department=${encodeURIComponent(d.slug)}"><span class="dot" style="background:${App.esc(d.accent)}"></span>${App.esc(d.name)}</a>`).join('');
    const authArea = user
      ? `<a class="icon-btn" href="/account.html">${App.esc(user.name.split(' ')[0])}</a>${user.role === 'admin' ? '<a class="icon-btn" href="/admin.html">Admin</a>' : ''}<button class="icon-btn" id="logout-btn" type="button">Log out</button>`
      : '<a class="icon-btn" href="/login.html">Log in</a><a class="btn btn-sm" href="/register.html">Create account</a>';
    const header = document.getElementById('site-header');
    if (!header) return;
    header.innerHTML = `<div class="topbar"><div class="container nav">
      <a class="brand" href="/"><span class="mstripe"><i></i><i></i><i></i></span>${App.esc(APP_NAME)}</a>
      <button class="icon-btn menu-toggle" id="menu-toggle" type="button" aria-label="Menu">Menu</button>
      <nav class="nav-links" id="nav-links">
        <a href="/" class="${active('/')}">Home</a>
        <div class="dropdown"><button class="linklike" type="button">Departments</button><div class="dropdown-menu">${deptLinks || '<a href="/vehicles.html">All vehicles</a>'}</div></div>
        <a href="/vehicles.html" class="${active('/vehicles.html')}">All vehicles</a>
        <a href="/contact.html" class="${active('/contact.html')}">Contact</a>
      </nav>
      <div class="nav-right">
        <a class="icon-btn" href="/wishlist.html" aria-label="Wishlist">Wishlist</a>
        <a class="icon-btn" href="/cart.html">Cart <span class="badge" id="cart-count">0</span></a>
        ${authArea}
      </div></div></div>`;
    const out = document.getElementById('logout-btn');
    if (out) out.addEventListener('click', App.logout);
    const tog = document.getElementById('menu-toggle');
    if (tog) tog.addEventListener('click', () => document.getElementById('nav-links').classList.toggle('open'));
  }

  function renderFooter(departments) {
    const el = document.getElementById('site-footer');
    if (!el) return;
    el.innerHTML = `<div class="footer"><div class="container">
      <div class="footer-grid">
        <div><div class="brand" style="margin-bottom:10px"><span class="mstripe"><i></i><i></i><i></i></span>${App.esc(APP_NAME)}</div>
          <p class="muted" style="font-size:.9rem;max-width:34ch">Hypercars and BMWs, inspected, photographed and delivered with care.</p></div>
        <div><h4>Departments</h4>${departments.map((d) => `<a href="/vehicles.html?department=${encodeURIComponent(d.slug)}">${App.esc(d.name)}</a>`).join('')}</div>
        <div><h4>Customer</h4><a href="/account.html">My account</a><a href="/wishlist.html">Wishlist</a><a href="/cart.html">Cart</a><a href="/contact.html">Book a test drive</a></div>
        <div><h4>Company</h4><a href="/contact.html">Contact us</a><a href="/contact.html?type=sell_car">Sell your car</a></div>
      </div>
      <div class="footer-bottom"><span>&copy; ${new Date().getFullYear()} ${App.esc(APP_NAME)}. Demo storefront for learning.</span><span>Prices shown in ${App.esc(cfg.CURRENCY || 'USD')}</span></div>
    </div></div>`;
  }

  App.ready = (async function init() {
    let departments = [];
    try {
      departments = (await App.api('/departments')).departments;
    } catch (e) { departments = []; }
    App.departments = departments;
    renderNav(departments);
    renderFooter(departments);
    document.title = (document.title ? document.title + ' | ' : '') + APP_NAME;
    await App.loadWishIds();
    App.refreshCartCount();
  })();

  window.App = App;
})();
