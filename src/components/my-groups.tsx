import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { MyGroupsBar, type GroupCard } from "@/components/my-groups-bar";

// Obtiene los grupos del usuario y los entrega a la barra cliente, que decide su
// visibilidad según la ruta. Devuelve null si no hay sesión (login/register).
export async function MyGroups() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const memberships = await prisma.groupMember.findMany({
    where: { userId: session.user.id },
    include: {
      group: {
        include: {
          _count: { select: { members: true } },
          owner: { select: { name: true } },
        },
      },
    },
    orderBy: { joinedAt: "asc" },
  });

  const groups: GroupCard[] = memberships.map(({ group }) => ({
    id: group.id,
    name: group.name,
    code: group.code,
    memberCount: group._count.members,
    ownerName: group.owner.name,
  }));

  return <MyGroupsBar groups={groups} />;
}
