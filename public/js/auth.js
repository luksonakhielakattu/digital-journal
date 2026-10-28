/**
 * Digital Journal — Authentication Logic (Login & Registration)
 */

document.addEventListener('DOMContentLoaded', () => {
  // If already authenticated, redirect straight to dashboard
  checkAuth({ redirectIfAuth: true });

  const registerForm = document.getElementById('registerForm');
  const loginForm = document.getElementById('loginForm');
  const authAlert = document.getElementById('authAlert');

  function showAlert(msg, type = 'danger') {
    if (!authAlert) return;
    authAlert.className = `alert alert-${type} alert-dismissible fade show`;
    authAlert.innerHTML = `
      <div class="d-flex align-items-center">
        <i class="bi bi-exclamation-circle-fill me-2 fs-5"></i>
        <div>${msg}</div>
      </div>
    `;
    authAlert.classList.remove('d-none');
  }

  function hideAlert() {
    if (authAlert) {
      authAlert.classList.add('d-none');
    }
  }

  // --- Registration Handler ---
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const submitBtn = registerForm.querySelector('button[type="submit"]');

      // Client-side validations
      if (name.length < 2) {
        showAlert('Please enter your full name (minimum 2 characters).');
        return;
      }

      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailRegex.test(email)) {
        showAlert('Please enter a valid email address.');
        return;
      }

      if (password.length < 6) {
        showAlert('Password must be at least 6 characters long.');
        return;
      }

      if (password !== confirmPassword) {
        showAlert('Passwords do not match. Please re-enter.');
        return;
      }

      // Submit state
      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Creating Account...
      `;

      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast('Account registered successfully! Redirecting...');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 800);
        } else {
          showAlert(data.message || 'Registration failed. Please try again.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      } catch (err) {
        console.error('Registration network error:', err);
        showAlert('Unable to connect to server. Please check your network and ensure the backend is running.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }

  // --- Login Handler ---
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert();

      const email = document.getElementById('email').value.trim();
      const password = document.getElementById('password').value;
      const submitBtn = loginForm.querySelector('button[type="submit"]');

      if (!email || !password) {
        showAlert('Please enter both your email and password.');
        return;
      }

      const originalBtnText = submitBtn.innerHTML;
      submitBtn.disabled = true;
      submitBtn.innerHTML = `
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        Signing In...
      `;

      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showToast('Signed in successfully! Loading dashboard...');
          setTimeout(() => {
            window.location.href = 'dashboard.html';
          }, 500);
        } else {
          showAlert(data.message || 'Invalid email or password.');
          submitBtn.disabled = false;
          submitBtn.innerHTML = originalBtnText;
        }
      } catch (err) {
        console.error('Login network error:', err);
        showAlert('Connection error. Please ensure the Node/MongoDB server is active.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
      }
    });
  }
});
