(async function () {
  await App.ready;
  if (!App.requireLogin()) return;
  const grid = document.getElementById('wish-grid');
  try {
    const d = await App.api('/wishlist');
    grid.innerHTML = d.items.length
      ? d.items.map(App.carCard).join('')
      : '<div class="empty" style="grid-column:1/-1"><h3>No saved cars yet</h3><p>Tap the heart on any vehicle to save it here.</p><a class="btn" href="/vehicles.html">Browse vehicles</a></div>';
    App.bindCards(grid);
  } catch (e) {
    grid.innerHTML = `<div class="empty" style="grid-column:1/-1">${App.esc(e.message)}</div>`;
  }
})();
