(async function () {
  await App.ready;
  const deptGrid = document.getElementById('dept-grid');
  try {
    const { departments } = await App.api('/departments');
    deptGrid.innerHTML = departments.map((d) => `
      <a class="dept-card" href="/vehicles.html?department=${encodeURIComponent(d.slug)}" style="--accent:${App.esc(d.accent)}">
        ${d.cover ? `<img src="${App.img(d.cover)}" alt="" loading="lazy">` : ''}
        <span class="dept-count">${d.vehicle_count} vehicles</span>
        <div class="dept-body"><h3>${App.esc(d.name)}</h3><p>${App.esc(d.tagline || '')}</p></div>
      </a>`).join('');

    const totalVehicles = departments.reduce((s, d) => s + d.vehicle_count, 0);
    document.getElementById('hero-stats').innerHTML = `
      <div><strong>${totalVehicles}</strong><span>Vehicles in stock</span></div>
      <div><strong>${departments.length}</strong><span>Departments</span></div>
      <div><strong>531 km/h</strong><span>Jesko Absolut claimed top speed</span></div>`;
  } catch (e) {
    deptGrid.innerHTML = `<div class="empty">${App.esc(e.message)}</div>`;
  }

  const grid = document.getElementById('featured-grid');
  try {
    const { vehicles } = await App.api('/vehicles?featured=1&limit=6&sort=price_desc');
    grid.innerHTML = vehicles.length ? vehicles.map(App.carCard).join('') : '<div class="empty">No featured vehicles yet.</div>';
    App.bindCards(grid);
    const hero = vehicles.find((v) => v.model.includes('Jesko Absolut')) || vehicles[0];
    const heroImg = document.getElementById('hero-img');
    if (hero) { heroImg.src = App.img(hero.image); heroImg.alt = hero.brand + ' ' + hero.model; }
  } catch (e) {
    grid.innerHTML = `<div class="empty">${App.esc(e.message)}</div>`;
  }
})();
