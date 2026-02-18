export const generateSlug = (subject) => {
  const stopWords = [
    "for",
    "and",
    "nor",
    "but",
    "or",
    "yet",
    "so",
    "a",
    "an",
    "the",
    "in",
    "on",
    "at",
    "to",
    "by",
    "of",
    "is",
    "are",
    "was",
    "were",
  ];

  const slug = subject
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters
    .split(" ")
    .filter((word) => !stopWords.includes(word) && word.length > 0)
    .slice(0, 5) // Take first 5 meaningful words
    .join("-");

  return slug;
};

// Function to extract post ID from slug
export const extractPostIdFromSlug = (slug) => {
  // If it's already a UUID format, return as is
  if (
    slug.match(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    )
  ) {
    return slug;
  }

  // Extract the UUID from the end of the slug
  const parts = slug.split("-");
  const uniqueId = parts[parts.length - 1];

  // You'll need to query your database to get the full UUID using this unique ID
  // This is a placeholder - implement according to your backend
  return getFullPostIdFromUniqueId(uniqueId);
};
