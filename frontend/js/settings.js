
import { createSidebar, initSidebar } from "./components/index.js";

const PROFILE_KEY = "docuping_profile_settings_v1";
const NOTIFICATION_KEY = "docuping_notification_preferences_v1";

document.addEventListener("DOMContentLoaded", () => {
    initSettings();
});

function initSettings() {
    // Initialize sidebar
    const sidebarMount = document.getElementById("sidebar-mount");

    if (sidebarMount) {
        sidebarMount.innerHTML = createSidebar("settings", "../");
        initSidebar();
    }

    loadProfile();
    loadNotificationPreferences();
    setupProfileForm();
    setupNotificationToggles();
    setupSettingsActions();
}

// Get saved profile
function getProfile() {
    try {
        return JSON.parse(localStorage.getItem(PROFILE_KEY)) || {};
    } catch {
        return {};
    }
}

// Load profile details
function loadProfile() {
    const profile = getProfile();

    let authUser = {};

    try {
        authUser = JSON.parse(
            localStorage.getItem("docuping_user_data")
        ) || {};
    } catch {
        authUser = {};
    }

    const name = profile.name || authUser.name || "DocuPing User";
    const email = profile.email || authUser.email || "";
    const college = profile.college || "";
    const course = profile.course || "";
    const year = profile.year || "";

    setValue("profile-name", name);
    setValue("profile-email", email);
    setValue("profile-college", college);
    setValue("profile-course", course);
    setValue("profile-year", year);

    updateProfileOverview(name, email);
}

// Update profile overview
function updateProfileOverview(name, email) {
    const nameElement = document.getElementById("profile-display-name");
    const emailElement = document.getElementById("profile-display-email");
    const avatarElement = document.getElementById("profile-avatar");

    if (nameElement) nameElement.textContent = name;
    if (emailElement) emailElement.textContent = email;

    if (avatarElement) {
        const initials = name
            .trim()
            .split(/\s+/)
            .map(word => word[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();

        avatarElement.textContent = initials || "DP";
    }
}

// Helper to set input values
function setValue(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.value = value;
    }
}

// Save profile form
function setupProfileForm() {
    const form = document.getElementById("profile-form");

    if (!form) return;

    form.addEventListener("submit", event => {
        event.preventDefault();

        const profile = {
            name: document.getElementById("profile-name")?.value.trim() || "",
            email: document.getElementById("profile-email")?.value.trim() || "",
            college: document.getElementById("profile-college")?.value.trim() || "",
            course: document.getElementById("profile-course")?.value.trim() || "",
            year: document.getElementById("profile-year")?.value || ""
        };

        if (!profile.name || !profile.email) {
            showToast("Please enter your name and email.");
            return;
        }

        localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));

        updateProfileOverview(profile.name, profile.email);

        showFormMessage("Profile saved successfully!");
        showToast("Profile updated successfully!");
    });
}

// Load notification preferences
function loadNotificationPreferences() {
    let preferences = {};

    try {
        preferences = JSON.parse(
            localStorage.getItem(NOTIFICATION_KEY)
        ) || {};
    } catch {
        preferences = {};
    }

    const defaults = {
        expiry: true,
        appointment: true,
        deadline: true
    };

    const finalPreferences = {
        ...defaults,
        ...preferences
    };

    setChecked("expiry-notifications", finalPreferences.expiry);
    setChecked("appointment-notifications", finalPreferences.appointment);
    setChecked("deadline-notifications", finalPreferences.deadline);
}

// Helper to set checkbox state
function setChecked(id, checked) {
    const element = document.getElementById(id);

    if (element) {
        element.checked = checked;
    }
}

// Save notification preferences whenever toggled
function setupNotificationToggles() {
    const notificationIds = [
        "expiry-notifications",
        "appointment-notifications",
        "deadline-notifications"
    ];

    notificationIds.forEach(id => {
        const checkbox = document.getElementById(id);

        if (!checkbox) return;

        checkbox.addEventListener("change", saveNotificationPreferences);
    });
}

function saveNotificationPreferences() {
    const preferences = {
        expiry: document.getElementById("expiry-notifications")?.checked ?? true,
        appointment: document.getElementById("appointment-notifications")?.checked ?? true,
        deadline: document.getElementById("deadline-notifications")?.checked ?? true
    };

    localStorage.setItem(NOTIFICATION_KEY, JSON.stringify(preferences));

    showToast("Notification preferences saved!");
}

// Profile edit and other settings actions
function setupSettingsActions() {
    const editButton = document.getElementById("edit-profile-btn");

    if (editButton) {
        editButton.addEventListener("click", () => {
            const nameInput = document.getElementById("profile-name");

            nameInput?.scrollIntoView({
                behavior: "smooth",
                block: "center"
            });

            nameInput?.focus();
        });
    }

    // Theme preference
    const themeSelect = document.getElementById("theme-preference");

    if (themeSelect) {
        themeSelect.value = "light";

        themeSelect.addEventListener("change", () => {
            if (themeSelect.value !== "light") {
                showToast("This theme will be available in a future update.");
                themeSelect.value = "light";
            }
        });
    }

    // Change password
    const passwordButton = document.getElementById("change-password-btn");

    if (passwordButton) {
        passwordButton.addEventListener("click", () => {
            showToast("Password management will be available soon.");
        });
    }

    // Logout
    const logoutButton = document.getElementById("logout-btn");

    if (logoutButton) {
        logoutButton.addEventListener("click", () => {
            const confirmLogout = confirm("Are you sure you want to log out?");

            if (!confirmLogout) return;

            localStorage.removeItem("docuping_auth_token");
            localStorage.removeItem("docuping_user_data");

            window.location.href = "login.html";
        });
    }
}

// Show form success message
function showFormMessage(message) {
    const messageElement = document.getElementById("profile-message");

    if (messageElement) {
        messageElement.textContent = message;
    }
}

// Toast notification
function showToast(message) {
    const toast = document.getElementById("settings-toast");

    if (!toast) return;

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2500);
}
