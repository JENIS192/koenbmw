(async function () {
  await App.ready;
  const state = { department: App.qs('department') || '', page: 1 };
  const $ = (id) => document.getElementById(id);
  const grid = $('car-grid');

  // Filter options
  try {
    const meta = await App.api('/vehicles/meta/filters');
    $('f-brand').innerHTML += meta.brands.map((b) => `<option value="${App.esc(b)}">${App.esc(b)}</option>`).join('');
    $('f-fuel').innerHTML += meta.fuels.map((f) => `<option value="${App.esc(f)}">${App.esc(f)}</option>`).join('');
  } catch (e) { /* filters are optional */ }

  if (App.qs('q')) $('f-q').value = App.qs('q');

  function renderChips() {
    const chips = [{ slug: '', name: 'All departments' }].concat(App.departments);
    $('dept-chips').innerHTML = chips.map((d) => `<button class="chip ${state.department === d.slug ? 'on' : ''}" data-slug="${App.esc(d.slug)}" type="button">${App.esc(d.name)}</button>`).join('');
    $('dept-chips').querySelectorAll('.chip').forEach((c) => c.addEventListener('click', () => {
      state.department = c.dataset.slug;
      state.page = 1;
      const url = new URL(location.href);
      if (state.department) url.searchParams.set('department', state.department); else url.searchParams.delete('department');
      history.replaceState(null, '', url);
      renderChips();
      load();
    }));
    const current = App.departments.find((d) => d.slug === state.department);
    $('list-title').textContent = current ? current.name : 'All vehicles';
    $('list-sub').textContent = current ? (current.description || '') : 'Search and filter our current inventory.';
  }

  async function load() {
    const p = new URLSearchParams();
    if (state.department) p.set('department', state.department);
    if ($('f-q').value.trim()) p.set('q', $('f-q').value.trim());
    if ($('f-brand').value) p.set('brand', $('f-brand').value);
    if ($('f-fuel').value) p.set('fuel', $('f-fuel').value);
    if ($('f-min').value) p.set('minPrice', $('f-min').value);
    if ($('f-max').value) p.set('maxPrice', $('f-max').value);
    if ($('f-avail').checked) p.set('status', 'available');
    p.set('sort', $('f-sort').value);
    p.set('page', state.page);
    p.set('limit', 12);
    grid.innerHTML = '<div class="empty" style="grid-column:1/-1">Loading vehicles...</div>';
    try {
      const d = await App.api('/vehicles?' + p.toString());
      $('result-count').textContent = `${d.total} vehicle${d.total === 1 ? '' : 's'} found`;
      grid.innerHTML = d.vehicles.length
        ? d.vehicles.map(App.carCard).join('')
        : '<div class="empty" style="grid-column:1/-1"><h3>No vehicles match these filters</h3><p>Try a wider price range or reset the filters.</p></div>';
      App.bindCards(grid);
      renderPager(d.page, d.pages);
    } catch (e) {
      grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${App.esc(e.message)}</div>`;
    }
  }

  function renderPager(page, pages) {
    const el = $('pager');
    if (pages <= 1) { el.innerHTML = ''; return; }
    let html = '';
    for (let i = 1; i <= pages; i++) html += `<button type="button" class="${i === page ? 'on' : ''}" data-p="${i}">${i}</button>`;
    el.innerHTML = html;
    el.querySelectorAll('button').forEach((b) => b.addEventListener('click', () => {
      state.page = Number(b.dataset.p);
      load();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }));
  }

  $('f-apply').addEventListener('click', () => { state.page = 1; load(); });
  $('f-sort').addEventListener('change', () => { state.page = 1; load(); });
  $('f-q').addEventListener('keydown', (e) => { if (e.key === 'Enter') { state.page = 1; load(); } });
  $('f-reset').addEventListener('click', () => {
    ['f-q', 'f-brand', 'f-fuel', 'f-min', 'f-max'].forEach((id) => { $(id).value = ''; });
    $('f-avail').checked = false;
    $('f-sort').value = 'newest';
    state.page = 1;
    load();
  });

  renderChips();
  load();
})();
