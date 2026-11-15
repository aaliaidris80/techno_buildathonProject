function searchDocuments(documents = [], query = "") {
  if (!Array.isArray(documents)) return [];

  const cleanQuery = String(query || "").trim().toLowerCase();
  if (!cleanQuery) return documents;

  return documents.filter((doc) => {
    if (!doc) return false;
    const nameMatch = String(doc.documentName || "").toLowerCase().includes(cleanQuery);
    const categoryMatch = String(doc.category || "").toLowerCase().includes(cleanQuery);
    const textMatch = String(doc.extractedText || "").toLowerCase().includes(cleanQuery);

    return nameMatch || categoryMatch || textMatch;
  });
}

module.exports = { searchDocuments };