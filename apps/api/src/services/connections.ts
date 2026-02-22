import {
  deleteConnection,
  listConnections,
  upsertLineConnection,
} from '../db/repositories/connections'
import { AppError } from '../lib/errors'
import { toIsoString } from './serializers'

function mapConnection(row: {
  id: string
  platform: string
  isActive: boolean
  createdAt: Date
}) {
  return {
    id: row.id,
    platform: row.platform,
    is_active: row.isActive,
    connected_at: toIsoString(row.createdAt),
  }
}

export async function listUserConnections(userId: string) {
  const rows = await listConnections(userId)
  return rows.map(mapConnection)
}

export async function connectLine(userId: string, lineUserId: string) {
  const [created] = await upsertLineConnection(userId, lineUserId)
  if (!created) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create connection')
  }
  return mapConnection(created)
}

export async function disconnectPlatform(userId: string, platform: 'line' | 'discord') {
  await deleteConnection(userId, platform)
}
