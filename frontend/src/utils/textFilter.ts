/**
 * Utility functions for filtering internal AI reasoning content from user-facing text
 */

/**
 * Removes <thinking> tags and their content from text
 * @param text - Input text that may contain thinking tags
 * @returns Text with thinking content removed
 */
export function removeThinkingContent(text: string): string {
  if (!text) return text;
  
  // Remove <thinking>...</thinking> blocks (including multiline content)
  return text.replace(/<thinking>[\s\S]*?<\/thinking>/gi, '').trim();
}

/**
 * List of internal tool names that should be hidden from users
 */
const INTERNAL_TOOL_NAMES = [
  'internet_search',
  'web_search',
  'search_internet', 
  'duckduckgo_search',
  'bing_search',
  'google_search'
];

/**
 * Checks if a tool should be hidden from user interface
 * @param toolName - Name of the tool to check
 * @returns True if tool should be hidden
 */
export function shouldHideInternalTool(toolName: string): boolean {
  if (!toolName) return false;
  return INTERNAL_TOOL_NAMES.includes(toolName.toLowerCase());
}

/**
 * Checks if text contains thinking content that should be filtered
 * @param text - Input text to check
 * @returns True if text contains thinking tags
 */
export function hasThinkingContent(text: string): boolean {
  if (!text) return false;
  return /<thinking>[\s\S]*?<\/thinking>/i.test(text);
}

/**
 * Determines if thinking content should be filtered based on environment
 * For now, always filter in frontend to ensure production safety
 * @returns True if thinking content should be filtered
 */
export function shouldFilterThinkingContent(): boolean {
  // Always filter thinking content in frontend for production safety
  return true;
}
