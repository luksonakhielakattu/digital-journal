/**
 * Digital Journal — User Profile & Account Settings Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
  const user = await checkAuth({ requireAuth: true });
  if (!user) return;

  loadProfileData();
  setupProfileForm();
  setupPasswordForm();
});

async function loadProfileData() {
  try {
    const res = await fetch('/api/profile');
    const data = await res.json();

    if (res.ok && data.success) {
      const p = data.profile;

      // Populate text labels
      document.getElementById('profileHeaderName').textContent = p.name;
      document.getElementById('profileHeaderEmail').textContent = p.email;
      document.getElementById('profileMemberSince').textContent = formatDate(p.createdAt);
      document.getElementById('profileTotalEntries').textContent = p.totalEntries;

      // Avatar initials
      const initials = p.name
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
      document.getElementById('profileBigAvatar').textContent = initials || 'U';

      // Inputs
      document.getElementById('profileNameInput').value = p.name || '';
      document.getElementById('profileBioInput').value = p.bio || '';
    }
  } catch (err) {
    console.error('Failed to load profile:', err);
    showToast('Failed to load user profile.', 'error');
  }
}

function setupProfileForm() {
  const form = document.getElementById('updateProfileForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = document.getElementById('profileNameInput').value.trim();
    const bio = document.getElementById('profileBioInput').value.trim();
    const submitBtn = form.querySelector('button[type="submit"]');

    if (name.length < 2) {
      showToast('Name must be at least 2 characters long.', 'warning');
      return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Updating...';

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, bio }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Profile information updated successfully!');
        loadProfileData();
        // Also update sidebar
        const sidebarName = document.getElementById('sidebarUserName');
        if (sidebarName) sidebarName.textContent = name;
      } else {
        showToast(data.message || 'Profile update failed.', 'error');
      }
    } catch (err) {
      console.error('Profile update error:', err);
      showToast('Network error while updating profile.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

function setupPasswordForm() {
  const form = document.getElementById('changePasswordForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const currentPassword = document.getElementById('currentPasswordInput').value;
    const newPassword = document.getElementById('newPasswordInput').value;
    const confirmPassword = document.getElementById('confirmNewPasswordInput').value;
    const submitBtn = form.querySelector('button[type="submit"]');

    if (!currentPassword) {
      showToast('Please enter your current password.', 'warning');
      return;
    }

    if (newPassword.length < 6) {
      showToast('New password must be at least 6 characters long.', 'warning');
      return;
    }

    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match.', 'warning');
      return;
    }

    const originalText = submitBtn.innerHTML;
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span> Changing...';

    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Password changed successfully!');
        form.reset();
      } else {
        showToast(data.message || 'Failed to change password.', 'error');
      }
    } catch (err) {
      console.error('Password change error:', err);
      showToast('Network error while changing password.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}
