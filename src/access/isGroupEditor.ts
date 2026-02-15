import type { Access } from "payload";

export const isGroupEditor: Access = ({ req: { user } }) => {
  if (user?.roles?.includes("admin")) return true;

  if (user?.roles?.includes("editor") && user.group) {
    return {
      group: {
        equals: typeof user.group === "object" ? user.group.id : user.group,
      },
    };
  }

  return false;
};
