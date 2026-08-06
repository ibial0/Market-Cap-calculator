import { Storage } from '../utils/storage.js';
import { State } from '../config/state.js';

// ─── Profile Modal Logic ───────────────────────────────────────────────
export const initProfile = () => {
    const profileBtn = document.getElementById('profile-btn');
    const profileOverlay = document.getElementById('profile-overlay');
    const closeProfile = document.getElementById('close-profile');
    const avatarUpload = document.getElementById('avatar-upload');
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const profileNameInput = document.getElementById('profile-name-input');
    const profileSaveBtn = document.getElementById('profile-save-btn');
    const headerAvatar = document.getElementById('header-avatar');
    const headerAvatarPlaceholder = document.getElementById('header-avatar-placeholder');

    // Load saved data
    _applyProfileUI();

    if (profileBtn) {
        profileBtn.addEventListener('click', () => {
            _applyProfileUI();
            profileOverlay.classList.add('active');
        });
    }

    if (closeProfile) {
        closeProfile.addEventListener('click', () => profileOverlay.classList.remove('active'));
    }

    // Close on backdrop click
    if (profileOverlay) {
        profileOverlay.addEventListener('click', (e) => {
            if (e.target === profileOverlay) profileOverlay.classList.remove('active');
        });
    }

    // Avatar upload — no quality loss (store as-is DataURL)
    if (avatarUpload) {
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            // Validate it's an image
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
                // Store original quality DataURL
                State.userLogo = dataUrl;
                Storage.set('userLogo', dataUrl);
                _updateAvatarUI(dataUrl);
            };
            reader.readAsDataURL(file);
        });
    }

    // Save name
    if (profileSaveBtn) {
        profileSaveBtn.addEventListener('click', () => {
            const name = profileNameInput ? profileNameInput.value.trim() : '';
            State.userName = name;
            Storage.set('userName', name);
            // Close modal with success feedback
            profileSaveBtn.textContent = '✓ Saved!';
            setTimeout(() => {
                profileSaveBtn.textContent = 'Save Profile';
                profileOverlay.classList.remove('active');
            }, 800);
        });
    }

    // Allow upload area click
    const uploadArea = document.getElementById('avatar-upload-area');
    if (uploadArea) {
        uploadArea.addEventListener('click', () => {
            if (avatarUpload) avatarUpload.click();
        });
    }
};

const _updateAvatarUI = (dataUrl) => {
    const avatarPreview = document.getElementById('avatar-preview');
    const avatarPlaceholder = document.getElementById('avatar-placeholder');
    const headerAvatar = document.getElementById('header-avatar');
    const headerAvatarPlaceholder = document.getElementById('header-avatar-placeholder');

    if (dataUrl) {
        if (avatarPreview) { avatarPreview.src = dataUrl; avatarPreview.classList.remove('hidden'); }
        if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');
        if (headerAvatar) { headerAvatar.src = dataUrl; headerAvatar.classList.remove('hidden'); }
        if (headerAvatarPlaceholder) headerAvatarPlaceholder.classList.add('hidden');
    } else {
        if (avatarPreview) avatarPreview.classList.add('hidden');
        if (avatarPlaceholder) avatarPlaceholder.classList.remove('hidden');
        if (headerAvatar) headerAvatar.classList.add('hidden');
        if (headerAvatarPlaceholder) headerAvatarPlaceholder.classList.remove('hidden');
    }
};

const _applyProfileUI = () => {
    const logo = Storage.get('userLogo', null);
    const name = Storage.get('userName', '');
    State.userLogo = logo;
    State.userName = name;

    _updateAvatarUI(logo);

    const profileNameInput = document.getElementById('profile-name-input');
    if (profileNameInput) profileNameInput.value = name;
};
