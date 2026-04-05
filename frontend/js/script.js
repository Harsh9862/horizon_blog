if (isAuthenticated()) {
  window.location.href = resolvePostAuthRedirect('home.html');
}

const registerForm = document.getElementById('register-form');

registerForm.addEventListener('submit', async function (event) {
  event.preventDefault();

  const displayName = document.getElementById('name').value.trim();
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;

  if (!displayName || !email || !password) {
    alert('Please fill in all fields.');
    return;
  }

  if (password.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }

  const submitButton = registerForm.querySelector('button[type="submit"]');
  const originalLabel = submitButton.textContent;

  try {
    submitButton.disabled = true;
    submitButton.textContent = 'Creating account...';

    const authResponse = await apiFetch('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        username: deriveUsername(displayName, email),
        email,
        password,
        displayName
      })
    });

    setSession(authResponse);
    window.location.href = resolvePostAuthRedirect('home.html');
  } catch (error) {
    alert(error.message || 'Unable to create account.');
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = originalLabel;
  }
});
