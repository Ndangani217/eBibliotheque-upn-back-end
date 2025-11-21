/**
 * Types standardisés pour les réponses API
 */

export interface ApiSuccessResponse<T = unknown> {
    status: 'success'
    message: string
    data: T
    meta?: PaginationMeta
}

export interface ApiErrorResponse {
    status: 'error'
    message: string
    errors?: Record<string, string[]>
}

export interface PaginationMeta {
    total: number
    perPage: number
    currentPage: number
    lastPage: number
    firstPage: number
    firstPageUrl: string
    lastPageUrl: string
    nextPageUrl: string | null
    previousPageUrl: string | null
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse

