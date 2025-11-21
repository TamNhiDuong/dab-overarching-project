// grader-utils.js

/**
 * Compute the Levenshtein distance between two strings.
 * This is the minimum number of insertions, deletions, and substitutions
 * needed to transform string a into string b.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} Levenshtein distance
 */
export function levenshteinDistance(a, b) {
  const lenA = a.length;
  const lenB = b.length;

  // Create matrix (lenA+1 x lenB+1)
  const dp = Array.from({ length: lenA + 1 }, () =>
    new Array(lenB + 1).fill(0)
  );

  // Initialize base cases
  for (let i = 0; i <= lenA; i++) dp[i][0] = i;
  for (let j = 0; j <= lenB; j++) dp[0][j] = j;

  // Fill DP matrix
  for (let i = 1; i <= lenA; i++) {
    for (let j = 1; j <= lenB; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;

      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,     // deletion
        dp[i][j - 1] + 1,     // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[lenA][lenB];
}
