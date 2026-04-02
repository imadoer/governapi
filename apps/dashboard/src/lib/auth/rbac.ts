export type Role = "admin" | "security" | "analyst" | "viewer";
export type Permission =
  | "read"
  | "write"
  | "delete"
  | "manage_users"
  | "configure_policies"
  | "manage_scans"
  | "view_reports"
  | "create_reports";

export const permissions: Record<Role, Permission[]> = {
  admin: ["read", "write", "delete", "manage_users", "configure_policies"],
  security: ["read", "write", "manage_scans", "configure_policies"],
  analyst: ["read", "view_reports", "create_reports"],
  viewer: ["read"],
};

export function hasPermission(userRole: Role, permission: Permission): boolean {
  return permissions[userRole]?.includes(permission) || false;
}

interface AuthenticatedRequest {
  user?: {
    role: Role;
  };
}

interface ApiResponse {
  status: (code: number) => {
    json: (data: { error: string }) => void;
  };
}

export function requirePermission(permission: Permission) {
  return function (
    req: AuthenticatedRequest,
    res: ApiResponse,
    next: () => void,
  ) {
    const userRole = req.user?.role;

    if (!userRole || !hasPermission(userRole, permission)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
}
