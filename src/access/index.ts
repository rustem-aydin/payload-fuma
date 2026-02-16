import type { Access, FieldAccess, Where } from "payload";

const checkRole = (allRoles: any, roleToCheck: string): boolean => {
  if (!allRoles) return false; // Eğer rol yoksa direkt false dön

  // Eğer array ise (eski veri veya hasMany: true kalıntıları)
  if (Array.isArray(allRoles)) {
    return allRoles.includes(roleToCheck);
  }

  // Eğer tekil string ise (hasMany: false)
  return allRoles === roleToCheck;
};

export const isAdmin: Access = ({ req: { user } }) => {
  if (!user) return false;
  return checkRole(user.roles, "admin");
};

export const isAdminOrGroupEditor: Access = ({ req: { user } }) => {
  if (!user) return false;

  // 1. Admin her şeyi görür
  if (checkRole(user.roles, "admin")) return true;

  // 2. Editör sadece kendi grubunu görür
  if (checkRole(user.roles, "editor")) {
    // Group objesi bazen ID string, bazen obje olarak gelebilir
    const groupId =
      typeof user.group === "object" && user.group !== null
        ? user.group.id
        : user.group;

    return {
      group: {
        equals: groupId,
      },
    } as Where;
  }

  // 3. Standart kullanıcı sadece kendini görür
  return {
    id: {
      equals: user.id,
    },
  } as Where;
};

export const isFieldAdmin: FieldAccess = ({ req: { user } }) => {
  return checkRole(user?.roles, "admin");
};
