import { Route } from "wouter";

/**
 * Simplified version of ProtectedRoute that doesn't check for authentication
 * This allows direct access to the cartographer tools without auth
 */
interface ProtectedRouteProps {
  path: string;
  component: React.ComponentType;
}

export function ProtectedRoute({ path, component: Component }: ProtectedRouteProps) {
  // Always render the component without auth check
  return (
    <Route path={path}>
      <Component />
    </Route>
  );
}