import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Add cache busting for GET requests
  const timestamp = Date.now();
  const urlWithCacheBuster = method === 'GET' && url.includes('?') 
    ? `${url}&_cb=${timestamp}` 
    : method === 'GET' 
      ? `${url}?_cb=${timestamp}` 
      : url;
      
  // Log current cookies for debugging
  const cookiesBeforeRequest = document.cookie;
  console.log("Cookies before request:", cookiesBeforeRequest);
  
  // Prepare request headers
  const headers: Record<string, string> = {
    // Enhanced cache control headers
    "Cache-Control": "no-cache, no-store, must-revalidate, private",
    "Pragma": "no-cache",
    "Expires": "0",
    // Ensure proper content type and auth
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest"
  };
  
  // Add content type for requests with body
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Enhanced fetch options for Replit environment
  const res = await fetch(urlWithCacheBuster, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Always include cookies with requests
    cache: "no-store",
    mode: "cors", // Enable CORS for cross-origin requests
    redirect: "follow" // Follow redirects automatically
  });

  // Log request details
  console.log(`API Request: ${method} ${url} - Status: ${res.status}`);
  
  // Specific handling for auth issues
  if (res.status === 401) {
    // Only log auth failures for non-auth endpoints
    if (url !== '/api/login' && url !== '/api/dev-login' && url !== '/api/register') {
      console.warn(`Authentication required for ${url}`);
      
      // Check if cookies changed during the request
      const cookiesAfterRequest = document.cookie;
      if (cookiesBeforeRequest !== cookiesAfterRequest) {
        console.log("Cookies changed during request - before:", cookiesBeforeRequest);
        console.log("Cookies after request:", cookiesAfterRequest);
      }
      
      // Try auto-login for specific routes that require auth
      if (url.startsWith('/api/workflows') || url.startsWith('/api/documents') || url === '/api/user') {
        try {
          // Attempt auto-login if needed
          console.log("Attempting auto re-authentication...");
          const loginRes = await fetch('/api/dev-login', {
            method: 'GET',
            credentials: "include",
            headers: {
              "Cache-Control": "no-cache, no-store, must-revalidate, private",
              "Pragma": "no-cache", 
              "Expires": "0"
            },
            cache: "no-store"
          });
          
          if (loginRes.ok) {
            console.log("Auto re-authentication successful");
            // Retry the original request
            return apiRequest(method, url, data);
          }
        } catch (e) {
          console.error("Auto re-authentication failed:", e);
        }
      }
    }
  }
  
  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Add cache busting parameter
    const url = queryKey[0] as string;
    const timestamp = Date.now();
    const urlWithCacheBuster = url.includes('?') 
      ? `${url}&_cb=${timestamp}` 
      : `${url}?_cb=${timestamp}`;
    
    // Log current cookies for debugging
    console.log("Current cookies:", document.cookie);
    
    // Log the URL that will be fetched
    console.log(`Fetching: ${urlWithCacheBuster}`);
    
    const res = await fetch(urlWithCacheBuster, {
      credentials: "include", // Always include cookies
      headers: {
        // Enhanced cache control
        "Cache-Control": "no-cache, no-store, must-revalidate, private",
        "Pragma": "no-cache",
        "Expires": "0",
        // Ensure proper content type
        "Accept": "application/json",
        "X-Requested-With": "XMLHttpRequest"
      },
      cache: "no-store",
      mode: "cors",
      redirect: "follow"
    });
    
    console.log(`Query: ${url} - Status: ${res.status} - Is Authenticated: ${res.status !== 401}`);

    // Enhanced unauthorized handling
    if (res.status === 401) {
      // For any 401 response, log detailed cookie information
      const cookiesAfter = document.cookie;
      console.log(`Cookies when receiving 401 from ${url}:`, cookiesAfter);
      
      if (unauthorizedBehavior === "returnNull") {
        console.log(`Auth required for ${url}, returning null`);
        return null;
      } else {
        // Don't retry auth for auth endpoints to avoid infinite loops
        if (url !== '/api/login' && url !== '/api/dev-login' && url !== '/api/register') {
          try {
            console.log("Attempting auto-login...");
            // Use improved fetch options for auto-login
            const loginRes = await fetch('/api/dev-login', {
              method: 'GET',
              credentials: "include",
              headers: {
                "Cache-Control": "no-cache, no-store, must-revalidate, private",
                "Pragma": "no-cache", 
                "Expires": "0",
                "Accept": "application/json",
                "X-Requested-With": "XMLHttpRequest"
              },
              cache: "no-store",
              mode: "cors",
              redirect: "follow"
            });
            
            // Add a slight delay to allow cookies to be processed
            await new Promise(resolve => setTimeout(resolve, 500));
            
            if (loginRes.ok) {
              const userData = await loginRes.json();
              console.log("Auto-login successful, user data:", userData);
              
              // Add another small delay to ensure cookies are fully processed
              await new Promise(resolve => setTimeout(resolve, 300));
              
              // Check what cookies we have after login
              console.log("Cookies after login:", document.cookie);
              
              // Retry the original request after successful login
              const retryRes = await fetch(urlWithCacheBuster, {
                method: 'GET',
                credentials: "include",
                headers: {
                  "Cache-Control": "no-cache, no-store, must-revalidate, private",
                  "Pragma": "no-cache",
                  "Expires": "0",
                  "Accept": "application/json",
                  "X-Requested-With": "XMLHttpRequest"
                },
                cache: "no-store",
                mode: "cors"
              });
              
              // Log the retry attempt
              console.log(`Retry attempt for ${url}: Status ${retryRes.status}`);
              
              if (retryRes.ok) {
                console.log("Retry successful");
                return await retryRes.json();
              } else {
                console.error("Retry failed:", retryRes.status);
                
                // Force reload the page as a last resort
                if (url === '/api/user') {
                  console.log("Will attempt to force reload");
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              }
            } else {
              console.error("Auto-login failed with status:", loginRes.status);
            }
          } catch (loginError) {
            console.error("Auto-login failed with error:", loginError);
          }
        }
      }
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 30000, // Refetch every 30 seconds
      refetchOnWindowFocus: true, // Refetch when window gets focus
      staleTime: 10000, // Data is fresh for 10 seconds
      retry: 3, // Retry failed requests 3 times
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1, // Retry mutations once
      retryDelay: 1000, // Wait 1 second before retrying
    },
  },
});
