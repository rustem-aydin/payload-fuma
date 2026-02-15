import type { Access } from "payload";

export const isAdminOrEditor: Access = ({ req: { user } }) => {
  return Boolean(
    user?.roles?.includes("admin") || user?.roles?.includes("editor"),
  );
};
