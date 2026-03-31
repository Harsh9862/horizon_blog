const form = document.getElementById('login-form');

form.addEventListener('submit', function (e) {
  e.preventDefault();

  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;

  if (!username || !password) {
    alert('Please fill in all fields.');
    return;
  }

  // Replace with your actual login logic (e.g. fetch/API call)
  console.log('Logging in:', { username });
  alert(`Welcome back, ${username}!`);
  form.reset();
});