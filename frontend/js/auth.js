/**
 * DocuPing - Authentication Controller (Login & Signup)
 * Manages form validation, password visibility toggling, prototype auth sessions, and toasts.
 */

import { CONFIG } from "./config.js";
import { toast } from "./components/toast.js";
import { ICONS } from "./utils/icons.js";

document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggles();
  initLoginForm();
  initSignupForm();
  initSocialAuth();
});

/**
 * 1. Show / Hide Password Toggle
 */
export function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll("[data-toggle-target]");

  toggleButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const targetId = btn.getAttribute("data-toggle-target");
      const input = document.getElementById(targetId);

      if (!input) return;

      const isPassword = input.getAttribute("type") === "password";
      const newType = isPassword ? "text" : "password";
      input.setAttribute("type", newType);

      btn.setAttribute("aria-label", isPassword ? "Hide password" : "Show password");
      btn.innerHTML = isPassword ? ICONS.eyeOff(18) : ICONS.eye(18);
    });
  });
}

/**
 * 2. Login Form Handling & Validation
 */
export function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");

  // Real-time error clearance
  [emailInput, passwordInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => clearFieldError(input));
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true;
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    // Validate email
    if (!email) {
      setFieldError(emailInput, "Please enter your email address.");
      isValid = false;
    } else if (!validateEmail(email)) {
      setFieldError(emailInput, "Please enter a valid email address.");
      isValid = false;
    }

    // Validate password
    if (!password) {
      setFieldError(passwordInput, "Please enter your password.");
      isValid = false;
    } else if (password.length < 6) {
      setFieldError(passwordInput, "Password must be at least 6 characters.");
      isValid = false;
    }

    if (!isValid) return;

    // Prototype Authentication Success
    submitPrototypeAuth({
      type: "login",
      user: {
        email: email,
        name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Student"
      },
      redirectUrl: "../index.html",
      successMsg: "Welcome back! Redirecting to your dashboard..."
    });
  });
}

/**
 * 3. Signup Form Handling & Validation
 */
export function initSignupForm() {
  const form = document.getElementById("signup-form");
  if (!form) return;

  const nameInput = document.getElementById("signup-name");
  const emailInput = document.getElementById("signup-email");
  const passwordInput = document.getElementById("signup-password");
  const confirmPasswordInput = document.getElementById("signup-confirm-password");
  const termsCheckbox = document.getElementById("signup-terms");

  [nameInput, emailInput, passwordInput, confirmPasswordInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => clearFieldError(input));
  });

  if (termsCheckbox) {
    termsCheckbox.addEventListener("change", () => clearFieldError(termsCheckbox));
  }

  form.addEventListener("submit", (e) => {
    e.preventDefault();

    let isValid = true;
    const name = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";

    // Validate Name
    if (!name) {
      setFieldError(nameInput, "Please enter your full name.");
      isValid = false;
    } else if (name.length < 2) {
      setFieldError(nameInput, "Name must be at least 2 characters.");
      isValid = false;
    }

    // Validate Email
    if (!email) {
      setFieldError(emailInput, "Please enter your email address.");
      isValid = false;
    } else if (!validateEmail(email)) {
      setFieldError(emailInput, "Please enter a valid email address.");
      isValid = false;
    }

    // Validate Password
    if (!password) {
      setFieldError(passwordInput, "Please create a password.");
      isValid = false;
    } else if (password.length < 6) {
      setFieldError(passwordInput, "Password must be at least 6 characters.");
      isValid = false;
    }

    // Validate Confirm Password
    if (!confirmPassword) {
      setFieldError(confirmPasswordInput, "Please confirm your password.");
      isValid = false;
    } else if (confirmPassword !== password) {
      setFieldError(confirmPasswordInput, "Passwords do not match.");
      isValid = false;
    }

    // Validate Terms Checkbox
    if (termsCheckbox && !termsCheckbox.checked) {
      setFieldError(termsCheckbox, "You must agree to the Terms & Privacy Policy.");
      isValid = false;
    }

    if (!isValid) return;

    // Prototype Registration Success
    submitPrototypeAuth({
      type: "signup",
      user: {
        name: name,
        email: email
      },
      redirectUrl: "onboarding.html", // Flow Screen 2: Student Onboarding
      successMsg: "Account created! Redirecting to student onboarding..."
    });
  });
}

/**
 * 4. Social Auth Buttons (Prototype)
 */
export function initSocialAuth() {
  const googleBtns = document.querySelectorAll("[data-social='google']");
  const githubBtns = document.querySelectorAll("[data-social='github']");

  googleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      submitPrototypeAuth({
        type: "google",
        user: { name: "Ananya Singh", email: "ananya@email.com" },
        redirectUrl: "../index.html",
        successMsg: "Connected via Google! Redirecting..."
      });
    });
  });

  githubBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      submitPrototypeAuth({
        type: "github",
        user: { name: "Ananya Singh", email: "ananya@github.com" },
        redirectUrl: "../index.html",
        successMsg: "Connected via GitHub! Redirecting..."
      });
    });
  });
}

/**
 * 5. Helper Validation & DOM Functions
 */
function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function setFieldError(inputEl, message) {
  if (!inputEl) return;
  inputEl.classList.add("is-invalid");

  const wrapper = inputEl.closest(".auth-input-group") || inputEl.closest(".form-field") || inputEl.parentElement;
  const errorEl = wrapper?.querySelector(".field-error-msg");
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add("is-visible");
  }
}

function clearFieldError(inputEl) {
  if (!inputEl) return;
  inputEl.classList.remove("is-invalid");

  const wrapper = inputEl.closest(".auth-input-group") || inputEl.closest(".form-field") || inputEl.parentElement;
  const errorEl = wrapper?.querySelector(".field-error-msg");
  if (errorEl) {
    errorEl.textContent = "";
    errorEl.classList.remove("is-visible");
  }
}

function submitPrototypeAuth({ user, redirectUrl, successMsg }) {
  // Store prototype session tokens
  const mockToken = "mock_jwt_token_" + Date.now();
  try {
    localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, mockToken);
    localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));
  } catch (e) {
    console.warn("localStorage unavailable:", e);
  }

  toast.success(successMsg);

  setTimeout(() => {
    window.location.href = redirectUrl;
  }, 1200);
}
