import { Storage } from '../utils/storage.js';
import { State } from '../config/state.js';

// ─── Profile Modal Logic ───────────────────────────────────────────────
export const initProfile = () => {
    // Menu elements
    const profileMenuBtn = document.getElementById('profile-menu-btn');
    const profileMenuOverlay = document.getElementById('profile-menu-overlay');
    const closeProfileMenu = document.getElementById('close-profile-menu');
    const menuEditProfileBtn = document.getElementById('menu-edit-profile-btn');
    const menuSettingsBtn = document.getElementById('menu-settings-btn');
    
    // Edit Profile elements
    const profileOverlay = document.getElementById('profile-overlay');
    const closeProfile = document.getElementById('close-profile');
    const avatarUpload = document.getElementById('avatar-upload');
    const profileNameInput = document.getElementById('profile-name-input');
    const profileSaveBtn = document.getElementById('profile-save-btn');
    const uploadArea = document.getElementById('avatar-upload-area');

    // Settings overlay
    const settingsOverlay = document.getElementById('settings-overlay');

    // Load saved data
    _applyProfileUI();

    // -- Profile Menu Listeners --
    if (profileMenuBtn) {
        profileMenuBtn.addEventListener('click', () => {
            _applyProfileUI();
            if (profileMenuOverlay) profileMenuOverlay.classList.add('active');
        });
    }
    if (closeProfileMenu) {
        closeProfileMenu.addEventListener('click', () => profileMenuOverlay.classList.remove('active'));
    }
    if (profileMenuOverlay) {
        profileMenuOverlay.addEventListener('click', (e) => {
            if (e.target === profileMenuOverlay) profileMenuOverlay.classList.remove('active');
        });
    }

    // Menu Actions
    if (menuEditProfileBtn) {
        menuEditProfileBtn.addEventListener('click', () => {
            if (profileMenuOverlay) profileMenuOverlay.classList.remove('active');
            if (profileOverlay) profileOverlay.classList.add('active');
        });
    }
    if (menuSettingsBtn) {
        menuSettingsBtn.addEventListener('click', () => {
            if (profileMenuOverlay) profileMenuOverlay.classList.remove('active');
            document.dispatchEvent(new Event('settings-opened'));
            if (settingsOverlay) settingsOverlay.classList.add('active');
        });
    }

    // -- Edit Profile Listeners --
    if (closeProfile) {
        closeProfile.addEventListener('click', () => profileOverlay.classList.remove('active'));
    }
    if (profileOverlay) {
        profileOverlay.addEventListener('click', (e) => {
            if (e.target === profileOverlay) profileOverlay.classList.remove('active');
        });
    }

    // Avatar upload
    if (avatarUpload) {
        avatarUpload.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file.');
                return;
            }

            const reader = new FileReader();
            reader.onload = (ev) => {
                const dataUrl = ev.target.result;
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
            _updateNameUI(name);
            
            profileSaveBtn.textContent = '✓ Saved!';
            setTimeout(() => {
                profileSaveBtn.textContent = 'Save Profile';
                profileOverlay.classList.remove('active');
            }, 800);
        });
    }

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
    
    // Menu UI
    const menuAvatar = document.getElementById('menu-avatar');
    const menuAvatarPlaceholder = document.getElementById('menu-avatar-placeholder');

    if (dataUrl) {
        if (avatarPreview) { avatarPreview.src = dataUrl; avatarPreview.classList.remove('hidden'); }
        if (avatarPlaceholder) avatarPlaceholder.classList.add('hidden');
        if (headerAvatar) { headerAvatar.src = dataUrl; headerAvatar.classList.remove('hidden'); }
        if (headerAvatarPlaceholder) headerAvatarPlaceholder.classList.add('hidden');
        
        if (menuAvatar) { menuAvatar.src = dataUrl; menuAvatar.classList.remove('hidden'); }
        if (menuAvatarPlaceholder) menuAvatarPlaceholder.classList.add('hidden');
    } else {
        if (avatarPreview) avatarPreview.classList.add('hidden');
        if (avatarPlaceholder) avatarPlaceholder.classList.remove('hidden');
        if (headerAvatar) headerAvatar.classList.add('hidden');
        if (headerAvatarPlaceholder) headerAvatarPlaceholder.classList.remove('hidden');
        
        if (menuAvatar) menuAvatar.classList.add('hidden');
        if (menuAvatarPlaceholder) menuAvatarPlaceholder.classList.remove('hidden');
    }
};

const _updateNameUI = (name) => {
    const menuUserName = document.getElementById('menu-user-name');
    if (menuUserName) {
        menuUserName.textContent = name || 'User';
    }
};

const _applyProfileUI = () => {
    const logo = Storage.get('userLogo', null);
    const name = Storage.get('userName', '');
    State.userLogo = logo;
    State.userName = name;

    _updateAvatarUI(logo);
    _updateNameUI(name);

    const profileNameInput = document.getElementById('profile-name-input');
    if (profileNameInput) profileNameInput.value = name;
};
