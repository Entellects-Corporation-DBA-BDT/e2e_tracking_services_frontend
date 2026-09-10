const ET_ZONE = "America/New_York";

const partsFor = (date, options) => Object.fromEntries(
  new Intl.DateTimeFormat("en-US", { timeZone: ET_ZONE, ...options })
    .formatToParts(date)
    .filter((part) => part.type !== "literal")
    .map((part) => [part.type, part.value])
);

export const easternToday = () => {
  const parts = partsFor(new Date(), { year: "numeric", month: "2-digit", day: "2-digit" });
  return [parts.year, parts.month, parts.day].join("-");
};

export const easternDateInputValue = (value, fallback = "") => {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : fallback;
};

const parseStoredParts = (value) => {
  const match = String(value || "").match(/^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2}))?)?/);
  return match ? {
    year: Number(match[1]), month: Number(match[2]), day: Number(match[3]),
    hour: Number(match[4] || 0), minute: Number(match[5] || 0), second: Number(match[6] || 0),
  } : null;
};

const zoneLabelForStoredTime = (parts) => {
  const probe = new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12));
  return partsFor(probe, { timeZoneName: "short" }).timeZoneName || "ET";
};

export const formatEasternDate = (value) => {
  const parts = parseStoredParts(value);
  if (!parts) return value || "-";
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "short", day: "numeric", year: "numeric",
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day, 12)));
  return label;
};

export const formatEasternDateTime = (value) => {
  const parts = parseStoredParts(value);
  if (!parts) return value || "-";
  const label = new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", month: "short", day: "numeric", year: "numeric",
    hour: "numeric", minute: "2-digit",
  }).format(new Date(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute)));
  return label + " " + zoneLabelForStoredTime(parts);
};

export const formatEasternInterviewSlot = (value) => {
  const match = String(value || "").match(/^(\d{4}-\d{2}-\d{2})\s+(\d{2}:\d{2})\s*-\s*(\d{2}:\d{2})$/);
  if (!match) return value || "-";
  const dateParts = parseStoredParts(match[1]);
  const time = (text) => {
    const pair = text.split(":");
    return new Intl.DateTimeFormat("en-US", { timeZone: "UTC", hour: "numeric", minute: "2-digit" })
      .format(new Date(Date.UTC(2000, 0, 1, Number(pair[0]), Number(pair[1]))));
  };
  return formatEasternDate(match[1]) + ", " + time(match[2]) + " - " + time(match[3]) + " " + zoneLabelForStoredTime(dateParts);
};