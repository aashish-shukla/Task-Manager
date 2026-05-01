// Auth page logic (login/signup)
document.addEventListener('DOMContentLoaded', () => {
  // If already logged in, redirect
  if (API.getToken()) {
    window.location.href = '/dashboard.html';
    return;
  }

  const loginForm = document.getElementById('loginForm');
  const signupForm = document.getElementById('signupForm');
  const showSignup = document.getElementById('showSignup');
  const showLogin = document.getElementById('showLogin');
  const loginSection = document.getElementById('loginSection');
  const signupSection = document.getElementById('signupSection');
  const loginError = document.getElementById('loginError');
  const signupError = document.getElementById('signupError');

  // Toggle forms
  if (showSignup) {
    showSignup.addEventListener('click', (e) => {
      e.preventDefault();
      loginSection.style.display = 'none';
      signupSection.style.display = 'block';
    });
  }
  if (showLogin) {
    showLogin.addEventListener('click', (e) => {
      e.preventDefault();
      signupSection.style.display = 'none';
      loginSection.style.display = 'block';
    });
  }

  // Login
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      loginError.classList.remove('show');
      const btn = loginForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Signing in...';
      try {
        const data = await API.post('/auth/login', {
          email: document.getElementById('loginEmail').value,
          password: document.getElementById('loginPassword').value,
        });
        API.setToken(data.data.token);
        API.setUser(data.data.user);
        window.location.href = '/dashboard.html';
      } catch (err) {
        loginError.textContent = err.message;
        loginError.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Sign In';
      }
    });
  }

  // Signup
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      signupError.classList.remove('show');
      const btn = signupForm.querySelector('button[type="submit"]');
      btn.disabled = true;
      btn.textContent = 'Creating account...';
      try {
        const data = await API.post('/auth/signup', {
          name: document.getElementById('signupName').value,
          email: document.getElementById('signupEmail').value,
          password: document.getElementById('signupPassword').value,
        });
        API.setToken(data.data.token);
        API.setUser(data.data.user);
        window.location.href = '/dashboard.html';
      } catch (err) {
        signupError.textContent = err.message;
        signupError.classList.add('show');
        btn.disabled = false;
        btn.textContent = 'Create Account';
      }
    });
  }
});
