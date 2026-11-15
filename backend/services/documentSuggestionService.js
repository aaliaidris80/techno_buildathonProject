function suggestDocumentDetails(extractedText = "") {
  const text = String(extractedText || "").toLowerCase();

  let documentName = "Uploaded Document";
  let category = "Other";
  let checklistKey = null;

  // 1. Achievements & Course Certificates
  if (text.includes("icpc")) {
    documentName = "ICPC Certificate";
    category = "Achievements";
    checklistKey = "achievement_certificate";
  } else if (
    text.includes("hackathon") ||
    text.includes("participation") ||
    text.includes("certificate") ||
    text.includes("has completed") ||
    text.includes("successfully completed") ||
    text.includes("workshop") ||
    text.includes("achievement") ||
    text.includes("winner") ||
    text.includes("merit") ||
    text.includes("nasscom") ||
    text.includes("nptel") ||
    text.includes("coursera")
  ) {
    documentName = "Achievement / Course Certificate";
    category = "Achievements";
    checklistKey = "achievement_certificate";
  }

  // 2. Academic
  else if (text.includes("10th") || text.includes("high school") || text.includes("secondary school")) {
    documentName = "10th Marksheet";
    category = "Academic";
    checklistKey = "class_10_marksheet";
  } else if (text.includes("12th") || text.includes("intermediate") || text.includes("senior secondary")) {
    documentName = "12th Marksheet";
    category = "Academic";
    checklistKey = "class_12_marksheet";
  } else if (
    text.includes("semester") ||
    text.includes("sgpa") ||
    text.includes("cgpa") ||
    text.includes("marksheet") ||
    text.includes("grade card") ||
    text.includes("transcript")
  ) {
    documentName = "Semester Marksheet";
    category = "Academic";
    checklistKey = "semester_marksheet";
  } else if (
    text.includes("identity card") ||
    text.includes("id card") ||
    text.includes("student id") ||
    text.includes("admit card") ||
    text.includes("bonafide")
  ) {
    documentName = "College ID / Academic Card";
    category = "Academic";
    checklistKey = "college_id";
  }

  // 3. Career
  else if (text.includes("internship")) {
    documentName = "Internship Certificate";
    category = "Career";
    checklistKey = "internship_certificate";
  } else if (text.includes("offer letter") || text.includes("appointment letter")) {
    documentName = "Offer Letter";
    category = "Career";
    checklistKey = null;
  } else if (
    text.includes("resume") ||
    text.includes("curriculum vitae") ||
    text.includes("education") ||
    text.includes("skills") ||
    text.includes("projects")
  ) {
    documentName = "Resume";
    category = "Career";
    checklistKey = "resume";
  }

  // 4. Finance
  else if (
    text.includes("fee receipt") ||
    text.includes("tuition fee") ||
    text.includes("payment receipt") ||
    text.includes("transaction id")
  ) {
    documentName = "Fee Receipt";
    category = "Finance";
    checklistKey = "fee_receipt";
  } else if (text.includes("scholarship") || text.includes("education loan")) {
    documentName = "Scholarship / Loan Document";
    category = "Finance";
    checklistKey = null;
  }

  // 5. Health
  else if (
    text.includes("prescription") ||
    text.includes("hospital") ||
    text.includes("medical") ||
    text.includes("doctor") ||
    text.includes("diagnosis")
  ) {
    documentName = "Medical Report";
    category = "Health";
    checklistKey = null;
  }

  return {
    documentName,
    category,
    checklistKey,
  };
}

module.exports = { suggestDocumentDetails };