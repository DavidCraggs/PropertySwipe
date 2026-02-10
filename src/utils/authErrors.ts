/**
 * Maps Supabase Auth error codes/messages to user-friendly strings.
 */
export function getAuthErrorMessage(error: {
  message: string;
  status?: number;
}): string {
  const msg = error.message?.toLowerCase() || '';

  if (error.status === 429 || msg.includes('rate limit')) {
    return 'Too many attempts. Please wait a moment before trying again.';
  }
  if (msg.includes('email not confirmed')) {
    return 'Please check your email to confirm your account.';
  }
  if (msg.includes('invalid login credentials')) {
    return 'Invalid email or password.';
  }
  if (msg.includes('otp has expired') || msg.includes('token has expired')) {
    return 'This link has expired. Please request a new one.';
  }
  if (
    msg.includes('email link is invalid') ||
    msg.includes('otp_disabled')
  ) {
    return 'This link is no longer valid. Please request a new one.';
  }
  if (msg.includes('user already registered')) {
    return 'An account with this email already exists. Try signing in instead.';
  }
  if (msg.includes('signups not allowed')) {
    return 'New signups are currently disabled. Please contact support.';
  }
  if (msg.includes('provider')) {
    return 'There was a problem with the sign-in provider. Please try again or use a different method.';
  }
  if (msg.includes('network') || msg.includes('fetch')) {
    return 'Network error. Please check your connection and try again.';
  }

  return 'Something went wrong. Please try again.';
}
