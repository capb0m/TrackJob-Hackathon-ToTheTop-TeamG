import { and, eq } from 'drizzle-orm'

import { db } from '../client'
import { externalConnections } from '../schema'

export function listConnections(userId: string) {
  return db.select().from(externalConnections).where(eq(externalConnections.userId, userId))
}

export function upsertLineConnection(userId: string, lineUserId: string) {
  return db
    .insert(externalConnections)
    .values({
      userId,
      platform: 'line',
      platformUserId: lineUserId,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [externalConnections.userId, externalConnections.platform],
      set: {
        platformUserId: lineUserId,
        isActive: true,
      },
    })
    .returning()
}

export function upsertDiscordConnection(userId: string, discordUserId: string) {
  return db
    .insert(externalConnections)
    .values({
      userId,
      platform: 'discord',
      platformUserId: discordUserId,
      isActive: true,
    })
    .onConflictDoUpdate({
      target: [externalConnections.userId, externalConnections.platform],
      set: {
        platformUserId: discordUserId,
        isActive: true,
      },
    })
    .returning()
}

export function deleteConnection(userId: string, platform: 'line' | 'discord') {
  return db
    .delete(externalConnections)
    .where(and(eq(externalConnections.userId, userId), eq(externalConnections.platform, platform)))
    .returning({ id: externalConnections.id })
}

export function listAllActiveConnections(platform: 'line' | 'discord') {
  return db
    .select()
    .from(externalConnections)
    .where(
      and(
        eq(externalConnections.platform, platform),
        eq(externalConnections.isActive, true),
      ),
    )
}

export async function findActiveConnectionByPlatformUserId(
  platform: 'line' | 'discord',
  platformUserId: string,
) {
  const rows = await db
    .select()
    .from(externalConnections)
    .where(
      and(
        eq(externalConnections.platform, platform),
        eq(externalConnections.platformUserId, platformUserId),
        eq(externalConnections.isActive, true),
      ),
    )
    .limit(1)

  return rows[0] ?? null
}
