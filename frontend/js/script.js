const form = document.getElementById('register-form');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;

  if (!name || !email || !password) {
    alert('Please fill in all fields.');
    return;
  }

  if (password.length < 8) {
    alert('Password must be at least 8 characters.');
    return;
  }

  // Replace this with your actual registration logic (e.g. fetch/API call)
  console.log('Registering:', { name, email });
  alert(`Welcome, ${name}! Your account has been created.`);
  form.reset();
});