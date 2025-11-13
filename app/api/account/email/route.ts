import { NextResponse } from 'next/server'
import { createProtectedPOST } from '@/lib/api-protection'
import { account } from '@/lib/appwrite'
import { auditLogger } from '@/lib/audit-log'
import { APIError, createSuccessResponse } from '@/lib/api-error-handler'
import { z } from 'zod'
import { logger } from '@/lib/logger'

const emailChangeSchema = z.object({
  newEmail: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
})

/**
 * POST /api/account/email
 * Change user's email address
 * 
 * Body:
 * {
 *   "newEmail": "new@example.com",
 *   "password": "current_password"
 * }
 */
export const POST = createProtectedPOST(
  async ({ body, request }) => {
    try {
      // Get authenticated user
      let user
      try {
        user = await account.get()
      } catch (error) {
        throw APIError.unauthorized('Unauthorized')
      }

      // Body is already validated by schema
      const { newEmail, password } = body

      // Verify password by attempting to create a session
      // We'll delete it immediately after verification
      let tempSession: any = null
      try {
        tempSession = await account.createEmailPasswordSession({
          email: user.email,
          password: password,
        })
        // Delete the temporary session immediately
        if (tempSession?.$id) {
          await account.deleteSession({ sessionId: tempSession.$id }).catch(() => {
            // Ignore errors when deleting temp session
          })
        }
      } catch (error: any) {
        if (error.code === 401 || error.message?.includes('Invalid credentials')) {
          throw APIError.unauthorized('Invalid password')
        }
        throw error
      }

      // Check if new email is different from current
      if (newEmail.toLowerCase() === user.email?.toLowerCase()) {
        throw APIError.badRequest('New email must be different from current email')
      }

      // Log email change attempt
      await auditLogger.logSecurityEvent(user.$id, 'EMAIL_CHANGE_ATTEMPT', {
        oldEmail: user.email,
        newEmail: newEmail,
        timestamp: new Date().toISOString(),
      })

      // Update email using Appwrite
      // Note: Appwrite requires email verification for email changes
      await account.updateEmail({
        email: newEmail,
        password: password,
      })

      // Log successful email change
      await auditLogger.logSecurityEvent(user.$id, 'EMAIL_CHANGED', {
        oldEmail: user.email,
        newEmail: newEmail,
        timestamp: new Date().toISOString(),
      })

      logger.info('Email change initiated', 'api/account/email', {
        userId: user.$id,
        oldEmail: user.email,
        newEmail: newEmail,
      })

      return createSuccessResponse(
        {
          message: 'Email change initiated. Please verify your new email address.',
          email: newEmail,
          verificationRequired: true,
        },
        'Email change initiated successfully'
      )
    } catch (error) {
      logger.error('Email change failed', 'api/account/email', error)

      if (error instanceof APIError) {
        throw error
      }

      // Handle Appwrite-specific errors
      if (error instanceof Error) {
        if (error.message.includes('Invalid credentials') || error.message.includes('401')) {
          throw APIError.unauthorized('Invalid password')
        }
        if (error.message.includes('already exists') || error.message.includes('409')) {
          throw APIError.conflict('This email address is already in use')
        }
        if (error.message.includes('Invalid email')) {
          throw APIError.badRequest('Invalid email address format')
        }
      }

      throw APIError.internalServerError('Failed to change email address')
    }
  },
  {
    rateLimit: 'auth',
    schema: emailChangeSchema,
  }
)

