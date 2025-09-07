/**
 * Default thumbnail images for jobs when category thumbnails are not available
 * These images will be used randomly as fallbacks
 */
export const DEFAULT_THUMBNAILS = [
  "/anime-person-with-laptop-in-rain-storm.png", // Anime-style person with laptop in rain/storm
  "/anime-person-with-laptop-indoors-rainy-day.png", // Anime-style person with laptop indoors on rainy day
] as const

/**
 * Get a random default thumbnail from the available options
 * @returns {string} Path to a random default thumbnail image
 */
export function getRandomDefaultThumbnail(): string {
  const randomIndex = Math.floor(Math.random() * DEFAULT_THUMBNAILS.length)
  return DEFAULT_THUMBNAILS[randomIndex]
}

/**
 * Get all available default thumbnails
 * @returns {readonly string[]} Array of all default thumbnail paths
 */
export function getAllDefaultThumbnails(): readonly string[] {
  return DEFAULT_THUMBNAILS
}
