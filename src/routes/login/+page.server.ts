import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { isOAuthProviderEnabled } from '$lib/server/auth-config'
import { isDemoModeEnabled } from '$lib/constants/demo-mode.js'
import { getTurnstileWidgetSettings } from '$lib/server/turnstile'

export const load: PageServerLoad = async ({ locals }) => {
  const session = await locals.auth()

  // If user is already logged in, redirect to new chat page
  if (session?.user) {
    throw redirect(302, '/newchat')
  }
  
  // Load OAuth provider availability from database settings
  try {
    const [
      googleEnabled,
      appleEnabled,
      twitterEnabled,
      facebookEnabled,
      turnstileSettings
    ] = await Promise.all([
      isOAuthProviderEnabled('google'),
      isOAuthProviderEnabled('apple'),
      isOAuthProviderEnabled('twitter'),
      isOAuthProviderEnabled('facebook'),
      getTurnstileWidgetSettings()
    ]);
    
    return {
      oauthProviders: {
        google: googleEnabled,
        apple: appleEnabled,
        twitter: twitterEnabled,
        facebook: facebookEnabled
      },
      turnstile: turnstileSettings,
      isDemoMode: isDemoModeEnabled()
    }
  } catch (error) {
    console.error('Failed to load OAuth provider settings for login page:', error);
    
    // Fallback - assume providers are available if settings can't be loaded
    return {
      oauthProviders: {
        google: true,
        apple: true,
        twitter: true,
        facebook: true
      },
      turnstile: {
        enabled: false,
        siteKey: ''
      },
      isDemoMode: isDemoModeEnabled()
    }
  }
}
