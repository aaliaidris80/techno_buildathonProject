
/**
 * DocuPing - Student Onboarding
 * Handles student profile setup and saves information locally.
 */

import { CONFIG } from "./config.js";

document.addEventListener("DOMContentLoaded", () => {
  initOnboarding();
});

function initOnboarding() {
  const form = document.getElementById("onboarding-form");
  const welcomeName = document.getElementById("welcome-name");
  const graduationSelect = document.getElementById("graduation-year");
  const errorElement = document.getElementById("form-error");
  const submitButton = form.querySelector('button[type="submit"]');

  // Read existing signup information
  let userData = {};

  try {
    userData = JSON.parse(
      localStorage.getItem(CONFIG.STORAGE_KEYS.USER_DATA) || "{}"
    );
  } catch (error) {
    console.warn("Could not read user data:", error);
  }

  // Display the student's name
  welcomeName.textContent = userData.name || "Student";

  // Generate graduation year options
  const currentYear = new Date().getFullYear();

  for (let year = currentYear; year <= currentYear + 7; year++) {
    const option = document.createElement("option");
    option.value = year;
    option.textContent = year;
    graduationSelect.appendChild(option);
  }

  // Handle form submission
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    errorElement.textContent = "";

    const profile = {
      college: document.getElementById("college").value.trim(),
      course: document.getElementById("course").value,
      branch: document.getElementById("branch").value.trim(),
      academicYear: document.getElementById("academic-year").value,
      graduationYear: graduationSelect.value
    };

    // Basic validation
    if (
      !profile.college ||
      !profile.course ||
      !profile.branch ||
      !profile.academicYear ||
      !profile.graduationYear
    ) {
      errorElement.textContent = "Please complete all the fields.";
      return;
    }

    try {
      // Save academic profile separately
      localStorage.setItem(
        "docuping_student_profile",
        JSON.stringify(profile)
      );

      // Keep signup information and add profile details
      const updatedUserData = {
        ...userData,
        ...profile,
        onboardingCompleted: true
      };

      localStorage.setItem(
        CONFIG.STORAGE_KEYS.USER_DATA,
        JSON.stringify(updatedUserData)
      );

      submitButton.disabled = true;
      submitButton.textContent = "Saving your profile...";

      // Redirect to main dashboard
      setTimeout(() => {
        window.location.href = "../index.html";
      }, 500);

    } catch (error) {
      console.error("Profile saving failed:", error);
      errorElement.textContent =
        "Unable to save your profile. Please try again.";
    }
  });
}
