// ============================================
// Middleware Exports
// ============================================

export {
    errorHandler,
    notFoundHandler,
    asyncHandler,
    AppError,
    BadRequestError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError,
    ValidationError,
} from './error-handler.js';

export {
    authenticate,
    optionalAuth,
    requirePlan,
    authenticateApiKey,
    authenticateAny,
    type AuthenticatedRequest,
} from './auth.js';

export {
    validate,
    paginationSchema,
    idParamSchema,
    emailSchema,
    passwordSchema,
    urlSchema,
    httpMethodSchema,
} from './validate.js';

export {
    defaultRateLimiter,
    authRateLimiter,
    apiRateLimiter,
    strictRateLimiter,
    planBasedRateLimiter,
} from './rate-limiter.js';

export {
    requestLogger,
    requestLoggerWithSkip,
} from './request-logger.js';
