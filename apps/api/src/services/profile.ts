import { createUser, getUserById, updateUser } from '../db/repositories/users'
import { AppError } from '../lib/errors'
import { toIsoString } from './serializers'

type ProfileRow = {
  id: string
  displayName: string
  monthlyIncome: number
  createdAt: Date
  updatedAt: Date
}

function mapProfileForGet(row: ProfileRow) {
  return {
    id: row.id,
    display_name: row.displayName,
    monthly_income: row.monthlyIncome,
    created_at: toIsoString(row.createdAt),
    updated_at: toIsoString(row.updatedAt),
  }
}

function mapProfileForCreate(row: ProfileRow) {
  return {
    id: row.id,
    display_name: row.displayName,
    monthly_income: row.monthlyIncome,
    created_at: toIsoString(row.createdAt),
  }
}

function mapProfileForPatch(row: ProfileRow) {
  return {
    id: row.id,
    display_name: row.displayName,
    monthly_income: row.monthlyIncome,
    updated_at: toIsoString(row.updatedAt),
  }
}

export async function createProfile(
  userId: string,
  data: { display_name: string; monthly_income: number },
) {
  const existing = await getUserById(userId)
  if (existing) {
    throw new AppError('CONFLICT', 'Profile already exists')
  }

  const [created] = await createUser(userId, {
    displayName: data.display_name,
    monthlyIncome: data.monthly_income,
  })

  if (!created) {
    throw new AppError('INTERNAL_ERROR', 'Failed to create profile')
  }

  return mapProfileForCreate(created)
}

export async function getProfile(userId: string) {
  const profile = await getUserById(userId)

  if (!profile) {
    throw new AppError('NOT_FOUND', 'Profile not found')
  }

  return mapProfileForGet(profile)
}

export async function patchProfile(
  userId: string,
  data: Partial<{ display_name: string; monthly_income: number }>,
) {
  const existing = await getUserById(userId)
  if (!existing) {
    throw new AppError('NOT_FOUND', 'Profile not found')
  }

  const [updated] = await updateUser(userId, {
    displayName: data.display_name,
    monthlyIncome: data.monthly_income,
  })

  if (!updated) {
    throw new AppError('INTERNAL_ERROR', 'Failed to update profile')
  }

  return mapProfileForPatch(updated)
}
