/**
 * Utility functions for checking environment secret availability
 */

/**
 * Check if the specified secrets are available in the environment
 * 
 * @param secrets Array of secret keys to check
 * @returns Object with the secret keys as keys and boolean values indicating availability
 */
export async function check_secrets(secrets: string[]): Promise<Record<string, boolean>> {
  try {
    // Create a response object with all secrets as keys
    const result: Record<string, boolean> = {};
    
    // For each secret, check if it's defined in the environment
    for (const secret of secrets) {
      // The actual secret value is not exposed to the client
      // We only check if it exists in the environment and return a boolean
      
      // MAPBOX_ACCESS_TOKEN is a special case for client-side checks
      if (secret === 'MAPBOX_ACCESS_TOKEN') {
        result[secret] = !!import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
        continue;
      }
      
      // For server-side secrets, we need to make an API call
      try {
        const response = await fetch(`/api/check-secret?key=${secret}`);
        const data = await response.json();
        result[secret] = data.exists;
      } catch (error) {
        console.error(`Error checking secret ${secret}:`, error);
        result[secret] = false;
      }
    }
    
    return result;
  } catch (error) {
    console.error('Error checking secrets:', error);
    
    // Return an object with all secrets as false for error case
    return secrets.reduce((acc, secret) => {
      acc[secret] = false;
      return acc;
    }, {} as Record<string, boolean>);
  }
}