import { redirect } from '@sveltejs/kit'
import type { PageServerLoad } from './$types'
import { isOAuthProviderEnabled } from '$lib/server/auth-config'
import { isDemoModeEnabled } from '$lib/constants/demo-mode.js'
import { isTurnstileEnabled } from '$lib/server/turnstile'
import { getTurnstileSiteKey } from '$lib/server/settings-store'
import { env } from '$env/dynamic/private'

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
      turnstileEnabled,
      turnstileSiteKey
    ] = await Promise.all([
      isOAuthProviderEnabled('google'),
      isOAuthProviderEnabled('apple'),
      isOAuthProviderEnabled('twitter'),
      isOAuthProviderEnabled('facebook'),
      isTurnstileEnabled(),
      getTurnstileSiteKey()
    ]);

    const turnstileFinalSiteKey = turnstileEnabled
      ? (turnstileSiteKey || env.TURNSTILE_SITE_KEY || '')
      : '';
    
    return {
      oauthProviders: {
        google: googleEnabled,
        apple: appleEnabled,
        twitter: twitterEnabled,
        facebook: facebookEnabled
      },
      isDemoMode: isDemoModeEnabled(),
      turnstile: {
        enabled: turnstileEnabled,
        siteKey: turnstileFinalSiteKey
      }
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
      isDemoMode: isDemoModeEnabled(),
      turnstile: {
        enabled: false,
        siteKey: ''
      }
    }
  }
}
