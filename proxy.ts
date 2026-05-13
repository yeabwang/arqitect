import { clerkMiddleware } from '@clerk/nextjs/server'

const signInUrl =
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL || '/sign-in'
const signUpUrl =
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL || '/sign-up'

export default clerkMiddleware({
  signInUrl,
  signUpUrl,
  afterSignInUrl: '/editor',
  afterSignUpUrl: '/editor',
})
