if (isAuthenticated()) {
  window.location.href = resolvePostAuthRedirect('home.html');
}

const loginForm = document.getElementById('login-form');

loginForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  const email = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!email || !password) {
    alert('Please fill in all fields.');
    return;
  }

  const submitButton = loginForm.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;

  try {
    submitButton.disabled = true;
    submitButton.textContent = 'Signing in...';

    const authResponse = await apiFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    setSession(authResponse);
    window.location.href = resolvePostAuthRedirect('home.html');
  } catch (error) {
    alert(error.message || 'Unable to sign in.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});
