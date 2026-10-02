export const educationDegrees = ["PhD", "M.Tech", "M.Sc", "MBA", "MCA", "M.Com", "M.A.", "B.Tech", "B.E.", "B.Sc", "B.Com", "B.A.", "BCA", "BBA", "Bachelor's degree / Graduation", "Diploma", "Intermediate / 12th Class", "10th Class", "Other"];
export const documentCategories = [["highest_degree", "Highest Degree"], ["intermediate", "Intermediate"], ["tenth_class", "10th Class"], ["other_education", "Other Education"], ["experience_1", "Company 1 Experience Letter"], ["experience_2", "Company 2 Experience Letter"], ["experience_3", "Company 3 Experience Letter"], ["computer_certifications", "Computer Certifications"], ["professional_certifications", "Professional Certifications"], ["achievements", "Achievements"], ["signature", "Signature"]];
export const localDate = () => {
  const d = new Date();
  return [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");
};
let rowSequence = 0;
export const newRowId = () => {
  if (typeof window !== "undefined" && window.crypto?.getRandomValues) return Array.from(window.crypto.getRandomValues(new Uint8Array(8)), b => b.toString(16).padStart(2, "0")).join("");
  // These IDs associate form rows with files; server-generated file IDs protect downloads.
  return "r" + Date.now().toString(36) + "_" + (++rowSequence).toString(36);
};
export const newEducation = () => ({
  id: newRowId(),
  degree: "",
  college: "",
  branch: "",
  passing_year: ""
});
export const newEmployment = () => ({
  id: newRowId(),
  company: "",
  designation: "",
  period: ""
});
export const newCertification = () => ({
  id: newRowId(),
  name: "",
  issuer: "",
  year: ""
});
export const newReference = () => ({
  id: newRowId(),
  name: "",
  relationship: "",
  organization: "",
  phone: "",
  email: ""
});
export function emptyCollection() {
  return {
    schema_version: 2,
    email: "",
    father_name: "",
    father_phone: "",
    mother_name: "",
    mother_phone: "",
    siblings: [],
    has_experience: false,
    employment: [],
    education: [newEducation()],
    certifications: [],
    references: [],
    achievements: "",
    declaration: {
      accepted: false
    },
    review: {
      reviewed_by: "",
      date: ""
    },
    documents: []
  };
}
export function normalizeCollection(value) {
  const defaults = emptyCollection();
  if (!value || typeof value !== "object") return {
    ...defaults,
    education: []
  };
  const legacy = value.schema_version !== 2;
  const employment = (value.employment || []).map((r, i) => ({
    ...r,
    id: r.id || "legacy" + (i + 1)
  })).filter(r => r.company || r.designation || r.period);
  const certifications = Array.isArray(value.certifications) ? value.certifications : (value.computer_certifications || []).filter(Boolean).map((name, i) => ({
    id: "legacy" + (i + 1),
    name,
    issuer: "",
    year: ""
  }));
  const documents = (value.documents || []).map(d => ({
    ...d,
    category: legacy && /^experience_[123]$/.test(d.category) ? "experience_legacy" + d.category.slice(-1) : d.category
  }));
  return {
    ...defaults,
    ...value,
    schema_version: 2,
    siblings: Array.isArray(value.siblings) ? value.siblings : [],
    education: Array.isArray(value.education) ? value.education : [],
    employment: legacy ? employment : value.employment || [],
    has_experience: legacy ? employment.length > 0 : Boolean(value.has_experience),
    certifications,
    references: value.references || [],
    documents,
    declaration: {
      accepted: false,
      ...value.declaration
    }
  };
}
export function collectionRequest(data, files = {}) {
  const collection = {
    ...data.collection,
    employment: data.collection?.has_experience ? data.collection.employment : []
  };
  const payload = new FormData();
  payload.append("payload", JSON.stringify({
    ...data,
    collection,
    document_upload_count: Object.values(files).flat().length
  }));
  Object.entries(files).forEach(([key, list]) => list.forEach(file => payload.append("documents[" + key + "][]", file)));
  return payload;
}
export function validateCollectionFiles(files, limits = {}) {
  const maxFile = limits.max_file_bytes || 2097152,
    maxTotal = limits.max_total_bytes || 7340032,
    all = Object.values(files).flat();
  if (all.length > (limits.max_files || 20)) return "Select no more than " + (limits.max_files || 20) + " files per submission.";
  for (const f of all) {
    if (!/\.(pdf|jpe?g|png|webp)$/i.test(f.name) || !["application/pdf", "image/jpeg", "image/png", "image/webp"].includes(f.type)) return f.name + ": choose PDF, JPG, PNG or WebP.";
    if (!f.size || f.size > maxFile) return f.name + ": maximum file size is " + (maxFile / 1048576).toFixed(1) + " MB.";
  }
  if (all.reduce((n, f) => n + f.size, 0) > maxTotal) return "Uploads must total no more than " + (maxTotal / 1048576).toFixed(1) + " MB.";
  return "";
}
