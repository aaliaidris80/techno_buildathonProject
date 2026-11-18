/**
 * DocuPing - Authentication Controller (Login & Signup)
 * Connected to Backend Auth APIs (/api/auth/login & /api/auth/register)
 */

import { CONFIG } from "./config.js";
import { api } from "./api.js";
import { toast } from "./components/toast.js";
import { ICONS } from "./utils/icons.js";

document.addEventListener("DOMContentLoaded", () => {
  initPasswordToggles();
  initLoginForm();
  initSignupForm();
  initSocialAuth();
});

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

export function initLoginForm() {
  const form = document.getElementById("login-form");
  if (!form) return;

  const emailInput = document.getElementById("login-email");
  const passwordInput = document.getElementById("login-password");

  [emailInput, passwordInput].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => clearFieldError(input));
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";

    if (!email) {
      setFieldError(emailInput, "Please enter your email address.");
      isValid = false;
    } else if (!validateEmail(email)) {
      setFieldError(emailInput, "Please enter a valid email address.");
      isValid = false;
    }

    if (!password) {
      setFieldError(passwordInput, "Please enter your password.");
      isValid = false;
    } else if (password.length < 6) {
      setFieldError(passwordInput, "Password must be at least 6 characters.");
      isValid = false;
    }

    if (!isValid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await api.post(CONFIG.ENDPOINTS.AUTH.LOGIN, { email, password });

      const token = res.token || res.data?.token;
      const user = res.user || res.data?.user || {
        email,
        name: email.split("@")[0].replace(/[._-]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      };

      if (token) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
      }
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      toast.success("Welcome back! Redirecting to your dashboard...");
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 900);
    } catch (error) {
      toast.error(error.message || "Login failed. Please check your credentials.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    let isValid = true;
    const name = nameInput?.value.trim() || "";
    const email = emailInput?.value.trim() || "";
    const password = passwordInput?.value || "";
    const confirmPassword = confirmPasswordInput?.value || "";

    if (!name || name.length < 2) {
      setFieldError(nameInput, "Name must be at least 2 characters.");
      isValid = false;
    }

    if (!email || !validateEmail(email)) {
      setFieldError(emailInput, "Please enter a valid email address.");
      isValid = false;
    }

    if (!password || password.length < 6) {
      setFieldError(passwordInput, "Password must be at least 6 characters.");
      isValid = false;
    }

    if (confirmPassword !== password) {
      setFieldError(confirmPasswordInput, "Passwords do not match.");
      isValid = false;
    }

    if (termsCheckbox && !termsCheckbox.checked) {
      setFieldError(termsCheckbox, "You must agree to the Terms & Privacy Policy.");
      isValid = false;
    }

    if (!isValid) return;

    const submitBtn = form.querySelector('button[type="submit"]');
    if (submitBtn) submitBtn.disabled = true;

    try {
      const res = await api.post(CONFIG.ENDPOINTS.AUTH.REGISTER, { name, email, password });

      const token = res.token || res.data?.token;
      const user = res.user || res.data?.user || { name, email };

      if (token) {
        localStorage.setItem(CONFIG.STORAGE_KEYS.AUTH_TOKEN, token);
      }
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER_DATA, JSON.stringify(user));

      toast.success("Account created! Redirecting...");
      setTimeout(() => {
        window.location.href = token ? "../index.html" : "login.html";
      }, 900);
    } catch (error) {
      toast.error(error.message || "Registration failed. Try again.");
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}

export function initSocialAuth() {
  const socialBtns = document.querySelectorAll("[data-social='google'], [data-social='github']");
  socialBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      toast.info("Please use Email & Password login/signup for live database sync.");
    });
  });
}

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