(async function () {
  await App.ready;
  const next = App.qs('next');
  const safeNext = next && next.startsWith('/') && !next.startsWith('//') ? next : '/';
  const msg = document.getElementById('msg');

  const login = document.getElementById('login-form');
  if (login) {
    login.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const d = await App.api('/auth/login', { method: 'POST', body: { email: document.getElementById('email').value, password: document.getElementById('password').value } });
        App.setSession(d.token, d.user);
        location.href = d.user.role === 'admin' && safeNext === '/' ? '/admin.html' : safeNext;
      } catch (err) { App.showMsg(msg, 'error', err.message); }
    });
  }

  const reg = document.getElementById('register-form');
  if (reg) {
    reg.addEventListener('submit', async (e) => {
      e.preventDefault();
      try {
        const d = await App.api('/auth/register', { method: 'POST', body: {
          name: document.getElementById('name').value, email: document.getElementById('email').value,
          phone: document.getElementById('phone').value, password: document.getElementById('password').value,
        } });
        App.setSession(d.token, d.user);
        location.href = safeNext;
      } catch (err) { App.showMsg(msg, 'error', err.message); }
    });
  }
})();
