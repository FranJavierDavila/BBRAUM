/**
 * Añade el usuario de demostración inspector1/test1234 a la BD indicada por DATABASE_URL.
 * Ejecutar: DATABASE_URL=file:... bun scripts/add-demo-user.ts
 */
import { PrismaClient } from "@prisma/client";
import * as bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const password = bcrypt.hashSync("test1234", 10);
  const user = await db.user.upsert({
    where: { username: "inspector1" },
    update: {},
    create: {
      username: "inspector1",
      email: "inspector1@bbraun.local",
      password,
      role: "USER",
      consentAt: new Date(),
    },
  });
  console.log("Usuario demo listo:", user.username, "/", user.role);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
