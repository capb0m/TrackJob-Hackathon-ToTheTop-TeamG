export * from './transaction'
export * from './budget'
export * from './goal'
export * from './assumption'
export * from './simulation'
export * from './advice'
export * from './profile'
export * from './chat'

export interface ApiErrorResponse {
  error: {
    code:
      | 'VALIDATION_ERROR'
      | 'UNAUTHORIZED'
      | 'FORBIDDEN'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'INTERNAL_ERROR'
    message: string
  }
}

export interface ApiSuccessResponse<T> {
  data: T
}
