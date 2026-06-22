import { PrismaClient } from "@prisma/client";

// 開発環境でのホットリロード時に PrismaClient のインスタンスが
// 際限なく増殖しDB接続数を圧迫しないよう、globalThis にキャッシュして使い回す。
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
