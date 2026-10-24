(async function () {
  await App.ready;
  const $ = (id) => document.getElementById(id);
  const user = App.user();
  if (user) { $('ct-name').value = user.name || ''; $('ct-email').value = user.email || ''; $('ct-phone').value = user.phone || ''; }

  const type = App.qs('type');
  if (['enquiry', 'test_drive', 'sell_car'].includes(type)) $('ct-type').value = type;

  try {
    const d = await App.api('/vehicles?limit=48&sort=price_desc&status=available');
    $('ct-vehicle').innerHTML += d.vehicles.map((v) => `<option value="${v.id}">${App.esc(v.year + ' ' + v.brand + ' ' + v.model)}</option>`).join('');
    if (App.qs('vehicle')) $('ct-vehicle').value = App.qs('vehicle');
  } catch (e) { /* optional */ }

  function sync() {
    const t = $('ct-type').value;
    $('ct-date-wrap').classList.toggle('hidden', t !== 'test_drive');
    $('ct-vehicle-wrap').classList.toggle('hidden', t === 'sell_car');
    if (t === 'sell_car' && !$('ct-message').value) $('ct-message').placeholder = 'Tell us the make, model, year, mileage and asking price.';
  }
  $('ct-type').addEventListener('change', sync);
  sync();

  $('contact-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = $('ct-msg');
    try {
      const r = await App.api('/inquiries', { method: 'POST', body: {
        type: $('ct-type').value, vehicle_id: $('ct-vehicle').value || null, name: $('ct-name').value, email: $('ct-email').value,
        phone: $('ct-phone').value, preferred_date: $('ct-date').value, message: $('ct-message').value,
      } });
      App.showMsg(msg, 'ok', r.message);
      $('ct-message').value = '';
    } catch (err) { App.showMsg(msg, 'error', err.message); }
  });
})();
