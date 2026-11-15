const REQUIRED_DOCUMENTS = [
  { key: "college_id", name: "College ID Card", category: "Academic" },
  { key: "class_10_marksheet", name: "10th Marksheet", category: "Academic" },
  { key: "class_12_marksheet", name: "12th Marksheet", category: "Academic" },
  { key: "semester_marksheet", name: "Semester Marksheet", category: "Academic" },
  { key: "fee_receipt", name: "Fee Receipt", category: "Finance" },
  { key: "resume", name: "Resume", category: "Career" },
  { key: "internship_certificate", name: "Internship Certificate", category: "Career" },
  { key: "achievement_certificate", name: "Achievement Certificate", category: "Achievements" },
];

function getChecklist(uploadedKeys = []) {
  const uniqueKeys = new Set((uploadedKeys || []).filter(Boolean));

  return REQUIRED_DOCUMENTS.map((doc) => ({
    key: doc.key,
    name: doc.name,
    category: doc.category,
    status: uniqueKeys.has(doc.key) ? "Uploaded" : "Missing",
  }));
}

function calculateReadiness(uploadedKeys = []) {
  const uniqueKeys = new Set((uploadedKeys || []).filter(Boolean));
  const total = REQUIRED_DOCUMENTS.length;
  const uploaded = REQUIRED_DOCUMENTS.filter((doc) => uniqueKeys.has(doc.key)).length;
  const missing = total - uploaded;
  const percentage = Math.round((uploaded / total) * 100);

  return {
    total,
    uploaded,
    missing,
    percentage,
  };
}

module.exports = {
  REQUIRED_DOCUMENTS,
  getChecklist,
  calculateReadiness,
};