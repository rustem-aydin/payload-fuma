import type { Access, Where } from "payload";

export const isGroupEditorOrPublished: Access = ({ req: { user } }) => {
  // 1. Admin her şeyi görür
  if (user?.roles?.includes("admin")) return true;

  // 2. Editör kendi grubunu görür
  if (user?.roles?.includes("editor") && user.group) {
    const groupId = typeof user.group === "object" ? user.group.id : user.group;

    return {
      group: {
        equals: groupId,
      },
    } as Where; // Tip zorlaması hatayı çözer
  }

  // 3. Giriş yapmamış veya standart user sadece yayınlanmışları görür
  return {
    _status: {
      equals: "published",
    },
  } as Where;
};
