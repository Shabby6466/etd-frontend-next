
export const isDevelopment = process.env.NODE_ENV === "development"
export const isProduction = process.env.NODE_ENV === "production"

export const env = {
  NEXT_PUBLIC_API_URL: "http://172.17.128:3836/v1/api",
  BACKEND_URL: "http://10.111.101.15:3836/v1/api",
  
  // JWT Configuration
  JWT_SECRET: process.env.JWT_SECRET || "your-jwt-secret-key-here",
  
  // Database Configuration
  DATABASE_URL: process.env.DATABASE_URL,
  
  // External APIs - Now handled by backend
  
  // Application Settings
  NODE_ENV: process.env.NODE_ENV || "development",
  PORT: process.env.PORT || "3000",
  
  // File Upload Configuration
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE || "10485760"),
  ALLOWED_FILE_TYPES: process.env.ALLOWED_FILE_TYPES || "application/pdf,image/jpeg,image/png",
  
  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || "info",
  
  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS || "http://localhost:3000,http://localhost:3001",
  
  // Rate Limiting
  RATE_LIMIT_REQUESTS: parseInt(process.env.RATE_LIMIT_REQUESTS || "100"),
  
  // Cache Configuration
  REDIS_URL: process.env.REDIS_URL,
  CACHE_TTL: parseInt(process.env.CACHE_TTL || "3600"),
}
