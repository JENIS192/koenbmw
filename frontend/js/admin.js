(async function () {
  await App.ready;
  const shell = document.getElementById('admin-shell');
  const denied = document.getElementById('admin-denied');
  const main = document.getElementById('admin-main');
  const user = App.user();
  if (!user || user.role !== 'admin') { denied.classList.remove('hidden'); return; }
  try {
    const me = (await App.api('/auth/me')).user;
    if (me.role !== 'admin') throw new Error('not admin');
  } catch (e) { denied.classList.remove('hidden'); return; }
  shell.classList.remove('hidden');

  const $ = (sel, root) => (root || document).querySelector(sel);
  const ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  const typeName = { test_drive: 'Test drive', enquiry: 'Enquiry', sell_car: 'Sell my car' };
  let vehiclePage = 1;
  let vehicleSearch = '';

  const views = { dashboard, vehicles, departments, orders, inquiries, users };

  document.querySelectorAll('#side button').forEach((b) => b.addEventListener('click', () => show(b.dataset.view)));
  function show(name) {
    document.querySelectorAll('#side button').forEach((x) => x.classList.toggle('on', x.dataset.view === name));
    main.innerHTML = '<p class="muted">Loading...</p>';
    views[name]().catch((e) => { main.innerHTML = `<div class="empty">${App.esc(e.message)}</div>`; });
  }

  // ---------------- Dashboard ----------------
  async function dashboard() {
    const s = await App.api('/admin/stats');
    setBadges(s);
    const maxV = Math.max(1, ...s.byDepartment.map((d) => d.vehicles));
    main.innerHTML = `
      <h1>Dashboard</h1>
      <div class="kpis">
        <div class="kpi"><strong>${App.money(s.orders.revenue)}</strong><span>Revenue (excluding cancelled)</span></div>
        <div class="kpi"><strong>${s.orders.total}</strong><span>Orders (${s.orders.pending} pending)</span></div>
        <div class="kpi"><strong>${s.vehicles.available}/${s.vehicles.total}</strong><span>Vehicles available</span></div>
        <div class="kpi"><strong>${s.customers}</strong><span>Customers (${s.inquiries.fresh} new enquiries)</span></div>
      </div>
      <div class="grid-2" style="align-items:start">
        <div class="card"><h3>Inventory by department</h3>
          ${s.byDepartment.map((d) => `<div class="bar-row"><span>${App.esc(d.name)}</span><div class="bar"><i style="width:${(d.vehicles / maxV) * 100}%;background:${App.esc(d.accent)}"></i></div><span class="muted">${d.vehicles} (${d.sold} sold)</span></div>`).join('')}
        </div>
        <div class="card"><h3>Recent orders</h3>
          ${s.recent.length ? `<table class="table-simple">${s.recent.map((o) => `<tr><td><strong>${App.esc(o.order_number)}</strong><div class="muted" style="font-size:.82rem">${App.esc(o.customer)}</div></td><td>${App.money(o.total)}</td><td><span class="pill ${o.status}">${o.status}</span></td></tr>`).join('')}</table>` : '<p class="muted">No orders yet.</p>'}
        </div>
      </div>`;
  }

  function setBadges(s) {
    const o = document.getElementById('nb-orders');
    const i = document.getElementById('nb-inq');
    o.textContent = s.orders.pending; o.classList.toggle('hidden', !s.orders.pending);
    i.textContent = s.inquiries.fresh; i.classList.toggle('hidden', !s.inquiries.fresh);
  }

  // ---------------- Vehicles ----------------
  async function vehicles() {
    const p = new URLSearchParams({ limit: 12, page: vehiclePage, sort: 'newest' });
    if (vehicleSearch) p.set('q', vehicleSearch);
    const d = await App.api('/vehicles?' + p.toString());
    main.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:16px">
        <h1 style="margin:0">Vehicles <span class="muted" style="font-size:1rem">(${d.total})</span></h1>
        <div style="display:flex;gap:10px"><input id="v-search" placeholder="Search vehicles" value="${App.esc(vehicleSearch)}" style="width:220px"><button class="btn" id="v-add" type="button">Add vehicle</button></div>
      </div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Photo</th><th>Vehicle</th><th>Department</th><th>Price</th><th>Stock</th><th>Status</th><th></th></tr></thead><tbody>
        ${d.vehicles.map((v) => `<tr>
          <td><img class="thumb" src="${App.img(v.image)}" alt=""></td>
          <td><strong>${v.year} ${App.esc(v.brand)} ${App.esc(v.model)}</strong>${v.featured ? ' <span class="pill available">Featured</span>' : ''}<div class="muted" style="font-size:.82rem">${App.esc(v.color || '')}</div></td>
          <td>${App.esc(v.department_name)}</td><td>${App.money(v.price)}</td><td>${v.stock}</td><td><span class="pill ${v.status}">${v.status}</span></td>
          <td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-edit="${v.id}" type="button">Edit</button> <button class="btn btn-danger btn-sm" data-del="${v.id}" type="button">Delete</button></td></tr>`).join('') || '<tr><td colspan="7" class="muted">No vehicles found.</td></tr>'}
      </tbody></table></div>
      <div class="pager">${Array.from({ length: d.pages }, (_, i) => `<button type="button" class="${i + 1 === d.page ? 'on' : ''}" data-p="${i + 1}">${i + 1}</button>`).join('')}</div>`;
    $('#v-add').addEventListener('click', () => vehicleForm(null));
    $('#v-search').addEventListener('keydown', (e) => { if (e.key === 'Enter') { vehicleSearch = e.target.value.trim(); vehiclePage = 1; show('vehicles'); } });
    main.querySelectorAll('[data-p]').forEach((b) => b.addEventListener('click', () => { vehiclePage = Number(b.dataset.p); show('vehicles'); }));
    main.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => vehicleForm(Number(b.dataset.edit))));
    main.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Delete this vehicle and its photos?')) return;
      try { await App.api('/vehicles/' + b.dataset.del, { method: 'DELETE' }); App.toast('Vehicle deleted', 'ok'); show('vehicles'); } catch (e) { App.toast(e.message, 'error'); }
    }));
  }

  async function vehicleForm(id) {
    let v = { brand: '', model: '', year: new Date().getFullYear(), price: '', mileage: 0, fuel: 'Petrol', transmission: 'Automatic', horsepower: '', top_speed: '', acceleration: '', color: '', description: '', stock: 1, featured: 0, department_id: '' };
    let images = [];
    if (id) {
      const d = await App.api('/vehicles/' + id);
      v = d.vehicle; images = d.images;
    }
    const deps = App.departments;
    const val = (x) => App.esc(x === null || x === undefined ? '' : x);
    const m = App.modal(id ? 'Edit vehicle' : 'Add vehicle', `
      <form id="vf" novalidate><div class="form-msg" id="vf-msg"></div>
        <div class="grid-2">
          <div class="field"><label>Department</label><select name="department_id" required><option value="">Choose department</option>${deps.map((d) => `<option value="${d.id}" ${Number(v.department_id) === d.id ? 'selected' : ''}>${App.esc(d.name)}</option>`).join('')}</select></div>
          <div class="field"><label>Brand</label><input name="brand" value="${val(v.brand)}" required placeholder="BMW or Koenigsegg"></div>
          <div class="field"><label>Model</label><input name="model" value="${val(v.model)}" required></div>
          <div class="field"><label>Year</label><input name="year" type="number" value="${val(v.year)}" required></div>
          <div class="field"><label>Price</label><input name="price" type="number" min="0" step="0.01" value="${val(v.price)}" required></div>
          <div class="field"><label>Mileage (km)</label><input name="mileage" type="number" min="0" value="${val(v.mileage)}"></div>
          <div class="field"><label>Fuel</label><select name="fuel">${['Petrol', 'Petrol (E85)', 'Diesel', 'Hybrid', 'Plug-in Hybrid', 'Electric'].map((f) => `<option ${v.fuel === f ? 'selected' : ''}>${f}</option>`).join('')}</select></div>
          <div class="field"><label>Transmission</label><input name="transmission" value="${val(v.transmission)}"></div>
          <div class="field"><label>Power (hp)</label><input name="horsepower" type="number" min="0" value="${val(v.horsepower)}"></div>
          <div class="field"><label>Top speed (km/h)</label><input name="top_speed" type="number" min="0" value="${val(v.top_speed)}"></div>
          <div class="field"><label>0 to 100 km/h (s)</label><input name="acceleration" type="number" min="0" step="0.1" value="${val(v.acceleration)}"></div>
          <div class="field"><label>Colour</label><input name="color" value="${val(v.color)}"></div>
          <div class="field"><label>Stock</label><input name="stock" type="number" min="0" value="${val(v.stock)}"></div>
          <div class="field"><label>&nbsp;</label><label style="color:var(--text);display:flex;gap:8px;align-items:center"><input type="checkbox" name="featured" ${v.featured ? 'checked' : ''}> Show on home page</label></div>
        </div>
        <div class="field"><label>Description</label><textarea name="description">${val(v.description)}</textarea></div>
        ${id && images.length ? `<div class="field"><label>Current photos</label><div class="photo-grid" id="cur-photos"></div></div>` : ''}
        <div class="field"><label>Upload car photos (JPG, PNG, WEBP, up to 8)</label>
          <div class="drop" id="drop">Drag photos here or choose files<br><input type="file" id="files" accept="image/jpeg,image/png,image/webp,image/gif" multiple style="margin-top:10px"></div>
          <div class="photo-grid" id="previews"></div></div>
        <button class="btn" type="submit" id="vf-save">${id ? 'Save changes' : 'Publish vehicle'}</button>
      </form>`);

    const root = m.el;
    let picked = [];

    function renderCurrent() {
      const box = $('#cur-photos', root);
      if (!box) return;
      box.innerHTML = images.map((im) => `<figure class="${im.is_primary ? 'cover' : ''}"><img src="${App.img(im.image_path)}" alt=""><div class="photo-actions"><button type="button" data-cover="${im.id}">${im.is_primary ? 'Cover' : 'Set cover'}</button><button type="button" data-rm="${im.id}">Remove</button></div></figure>`).join('');
      box.querySelectorAll('[data-cover]').forEach((b) => b.addEventListener('click', async () => {
        try {
          await App.api('/vehicles/images/' + b.dataset.cover + '/primary', { method: 'PATCH' });
          images = images.map((im) => ({ ...im, is_primary: im.id === Number(b.dataset.cover) ? 1 : 0 }));
          renderCurrent();
        } catch (e) { App.toast(e.message, 'error'); }
      }));
      box.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', async () => {
        if (!confirm('Remove this photo?')) return;
        try {
          await App.api('/vehicles/images/' + b.dataset.rm, { method: 'DELETE' });
          const was = images.find((im) => im.id === Number(b.dataset.rm));
          images = images.filter((im) => im.id !== Number(b.dataset.rm));
          if (was && was.is_primary && images.length) images[0].is_primary = 1;
          renderCurrent();
        } catch (e) { App.toast(e.message, 'error'); }
      }));
    }
    renderCurrent();

    function renderPreviews() {
      const box = $('#previews', root);
      box.innerHTML = '';
      picked.forEach((f, i) => {
        const fig = document.createElement('figure');
        const img = document.createElement('img');
        img.alt = '';
        img.src = URL.createObjectURL(f);
        const row = document.createElement('div');
        row.className = 'photo-actions';
        const rm = document.createElement('button');
        rm.type = 'button'; rm.textContent = 'Remove';
        rm.addEventListener('click', () => { picked.splice(i, 1); renderPreviews(); });
        row.appendChild(rm); fig.appendChild(img); fig.appendChild(row); box.appendChild(fig);
      });
    }
    function addFiles(list) {
      const okTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      for (const f of list) {
        if (!okTypes.includes(f.type)) { App.toast(f.name + ' is not a supported photo', 'error'); continue; }
        if (picked.length >= 8) { App.toast('You can upload up to 8 photos at once', 'error'); break; }
        picked.push(f);
      }
      renderPreviews();
    }
    $('#files', root).addEventListener('change', (e) => { addFiles(Array.from(e.target.files)); e.target.value = ''; });
    const drop = $('#drop', root);
    ['dragenter', 'dragover'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.add('over'); }));
    ['dragleave', 'drop'].forEach((ev) => drop.addEventListener(ev, (e) => { e.preventDefault(); drop.classList.remove('over'); }));
    drop.addEventListener('drop', (e) => addFiles(Array.from(e.dataTransfer.files)));

    $('#vf', root).addEventListener('submit', async (e) => {
      e.preventDefault();
      const form = e.target;
      const btn = $('#vf-save', root);
      const fd = new FormData();
      ['department_id', 'brand', 'model', 'year', 'price', 'mileage', 'fuel', 'transmission', 'horsepower', 'top_speed', 'acceleration', 'color', 'stock', 'description'].forEach((k) => fd.append(k, form.elements[k].value));
      fd.append('featured', form.elements.featured.checked ? 'true' : 'false');
      picked.forEach((f) => fd.append('images', f));
      btn.disabled = true;
      btn.textContent = 'Saving...';
      try {
        await App.api(id ? '/vehicles/' + id : '/vehicles', { method: id ? 'PUT' : 'POST', body: fd });
        App.toast(id ? 'Vehicle updated' : 'Vehicle published', 'ok');
        m.close();
        const depRes = await App.api('/departments');
        App.departments = depRes.departments;
        show('vehicles');
      } catch (err) {
        App.showMsg($('#vf-msg', root), 'error', err.message);
        btn.disabled = false;
        btn.textContent = id ? 'Save changes' : 'Publish vehicle';
      }
    });
  }

  // ---------------- Departments ----------------
  async function departments() {
    const { departments: list } = await App.api('/departments');
    App.departments = list;
    main.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px"><h1 style="margin:0">Departments</h1><button class="btn" id="d-add" type="button">Add department</button></div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Brand</th><th>Tagline</th><th>Vehicles</th><th></th></tr></thead><tbody>
      ${list.map((d) => `<tr><td><span class="dot" style="background:${App.esc(d.accent)};margin-right:8px"></span><strong>${App.esc(d.name)}</strong></td><td>${App.esc(d.brand)}</td><td>${App.esc(d.tagline || '')}</td><td>${d.vehicle_count}</td>
        <td style="white-space:nowrap"><button class="btn btn-ghost btn-sm" data-edit="${d.id}" type="button">Edit</button> <button class="btn btn-danger btn-sm" data-del="${d.id}" type="button">Delete</button></td></tr>`).join('')}
      </tbody></table></div>`;
    $('#d-add').addEventListener('click', () => deptForm(null, list));
    main.querySelectorAll('[data-edit]').forEach((b) => b.addEventListener('click', () => deptForm(list.find((d) => d.id === Number(b.dataset.edit)), list)));
    main.querySelectorAll('[data-del]').forEach((b) => b.addEventListener('click', async () => {
      if (!confirm('Delete this department?')) return;
      try { await App.api('/departments/' + b.dataset.del, { method: 'DELETE' }); App.toast('Department deleted', 'ok'); show('departments'); } catch (e) { App.toast(e.message, 'error'); }
    }));
  }

  function deptForm(d, list) {
    const x = d || { name: '', brand: 'BMW', tagline: '', description: '', accent: '#53a8e2' };
    const m = App.modal(d ? 'Edit department' : 'Add department', `
      <form id="df" novalidate><div class="form-msg" id="df-msg"></div>
        <div class="grid-2"><div class="field"><label>Name</label><input name="name" value="${App.esc(x.name)}" required></div>
        <div class="field"><label>Brand</label><input name="brand" value="${App.esc(x.brand)}"></div></div>
        <div class="field"><label>Tagline</label><input name="tagline" value="${App.esc(x.tagline || '')}"></div>
        <div class="field"><label>Description</label><textarea name="description">${App.esc(x.description || '')}</textarea></div>
        <div class="field"><label>Accent colour</label><input name="accent" type="color" value="${/^#[0-9a-fA-F]{6}$/.test(x.accent) ? x.accent : '#53a8e2'}" style="height:44px;padding:4px"></div>
        <button class="btn" type="submit">${d ? 'Save changes' : 'Add department'}</button></form>`);
    $('#df', m.el).addEventListener('submit', async (e) => {
      e.preventDefault();
      const f = e.target.elements;
      const body = { name: f.name.value, brand: f.brand.value, tagline: f.tagline.value, description: f.description.value, accent: f.accent.value };
      try {
        await App.api(d ? '/departments/' + d.id : '/departments', { method: d ? 'PUT' : 'POST', body });
        App.toast('Department saved', 'ok');
        m.close();
        show('departments');
      } catch (err) { App.showMsg($('#df-msg', m.el), 'error', err.message); }
    });
  }

  // ---------------- Orders ----------------
  async function orders() {
    const { orders: list } = await App.api('/admin/orders');
    main.innerHTML = `<h1>Orders</h1><div class="table-wrap"><table class="table"><thead><tr><th>Order</th><th>Customer</th><th>Vehicles</th><th>Total</th><th>Payment</th><th>Status</th></tr></thead><tbody>
      ${list.map((o) => `<tr>
        <td><strong>${App.esc(o.order_number)}</strong><div class="muted" style="font-size:.82rem">${App.date(o.created_at)}</div></td>
        <td>${App.esc(o.customer)}<div class="muted" style="font-size:.82rem">${App.esc(o.customer_email)}<br>${App.esc(o.shipping_city)}, ${App.esc(o.shipping_country)}</div></td>
        <td>${o.items.map((i) => App.esc(i.vehicle_name)).join('<br>')}</td>
        <td>${App.money(o.total)}</td><td>${App.esc(o.payment_method.replace(/_/g, ' '))}</td>
        <td>${o.status === 'cancelled' ? '<span class="pill cancelled">cancelled</span>' : `<select data-status="${o.id}">${ORDER_STATUSES.map((s) => `<option value="${s}" ${o.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select>`}</td></tr>`).join('') || '<tr><td colspan="6" class="muted">No orders yet.</td></tr>'}
      </tbody></table></div>`;
    main.querySelectorAll('[data-status]').forEach((s) => s.addEventListener('change', async () => {
      if (s.value === 'cancelled' && !confirm('Cancel this order and release the vehicles?')) { show('orders'); return; }
      try { await App.api('/admin/orders/' + s.dataset.status + '/status', { method: 'PATCH', body: { status: s.value } }); App.toast('Order updated', 'ok'); show('orders'); } catch (e) { App.toast(e.message, 'error'); show('orders'); }
    }));
  }

  // ---------------- Enquiries ----------------
  async function inquiries() {
    const { inquiries: list } = await App.api('/admin/inquiries');
    main.innerHTML = `<h1>Enquiries and test drives</h1><div class="table-wrap"><table class="table"><thead><tr><th>Date</th><th>From</th><th>Type</th><th>Vehicle</th><th>Message</th><th>Status</th></tr></thead><tbody>
      ${list.map((i) => `<tr><td>${App.date(i.created_at)}${i.preferred_date ? `<div class="muted" style="font-size:.82rem">Wants ${App.date(i.preferred_date)}</div>` : ''}</td>
        <td>${App.esc(i.name)}<div class="muted" style="font-size:.82rem">${App.esc(i.email)}${i.phone ? '<br>' + App.esc(i.phone) : ''}</div></td>
        <td>${typeName[i.type]}</td><td>${App.esc(i.vehicle_name || '-')}</td><td style="max-width:320px">${App.esc(i.message)}</td>
        <td><select data-inq="${i.id}">${['new', 'contacted', 'closed'].map((s) => `<option ${i.status === s ? 'selected' : ''}>${s}</option>`).join('')}</select></td></tr>`).join('') || '<tr><td colspan="6" class="muted">No enquiries yet.</td></tr>'}
      </tbody></table></div>`;
    main.querySelectorAll('[data-inq]').forEach((s) => s.addEventListener('change', async () => {
      try { await App.api('/admin/inquiries/' + s.dataset.inq, { method: 'PATCH', body: { status: s.value } }); App.toast('Enquiry updated', 'ok'); } catch (e) { App.toast(e.message, 'error'); }
    }));
  }

  // ---------------- Users ----------------
  async function users() {
    const { users: list } = await App.api('/admin/users');
    main.innerHTML = `<h1>Customers</h1><div class="table-wrap"><table class="table"><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Role</th><th>Orders</th><th>Joined</th></tr></thead><tbody>
      ${list.map((u) => `<tr><td>${App.esc(u.name)}</td><td>${App.esc(u.email)}</td><td>${App.esc(u.phone || '-')}</td><td><span class="pill ${u.role === 'admin' ? 'confirmed' : ''}">${u.role}</span></td><td>${u.orders}</td><td>${App.date(u.created_at)}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  try { setBadges(await App.api('/admin/stats')); } catch (e) { /* badges optional */ }
  show('dashboard');
})();
