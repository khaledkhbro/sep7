// OAuth authentication utilities
import type { User } from "@/lib/auth"

export interface OAuthProvider {
  name: string
  clientId: string
  clientSecret: string
  redirectUri: string
  scope: string
  isEnabled: boolean
}

export interface OAuthUserInfo {
  id: string
  email: string
  name: string
  firstName?: string
  lastName?: string
  picture?: string
  provider: string
}

export async function getOAuthProviders(): Promise<OAuthProvider[]> {
  try {
    const response = await fetch("/api/oauth/providers")
    if (!response.ok) {
      throw new Error("Failed to fetch OAuth providers")
    }
    return await response.json()
  } catch (error) {
    console.error("[v0] Failed to get OAuth providers:", error)
    return []
  }
}

export async function getOAuthProvider(providerName: string): Promise<OAuthProvider | null> {
  try {
    const response = await fetch(`/api/oauth/providers/${providerName}`)
    if (!response.ok) {
      return null
    }
    return await response.json()
  } catch (error) {
    console.error(`[v0] Failed to get OAuth provider ${providerName}:`, error)
    return null
  }
}

export async function initiateOAuthFlow(provider: string): Promise<void> {
  try {
    console.log(`[v0] Initiating OAuth flow for ${provider}`)

    const providerConfig = await getOAuthProvider(provider)
    if (!providerConfig || !providerConfig.isEnabled) {
      throw new Error(`${provider} authentication is not configured or enabled`)
    }

    // Generate state parameter for security
    const state = generateRandomString(32)
    localStorage.setItem(`oauth_state_${provider}`, state)

    // Build OAuth authorization URL
    const authUrl = buildAuthorizationUrl(provider, providerConfig, state)

    console.log(`[v0] Redirecting to ${provider} OAuth:`, authUrl)

    // Redirect to OAuth provider
    window.location.href = authUrl
  } catch (error) {
    console.error(`[v0] Failed to initiate OAuth flow for ${provider}:`, error)
    throw error
  }
}

export async function handleOAuthCallback(provider: string, code: string, state?: string): Promise<User> {
  try {
    console.log(`[v0] Handling OAuth callback for ${provider}`)

    // Verify state parameter
    const storedState = localStorage.getItem(`oauth_state_${provider}`)
    if (state && storedState !== state) {
      throw new Error("Invalid OAuth state parameter")
    }

    // Clean up stored state
    localStorage.removeItem(`oauth_state_${provider}`)

    // Exchange code for tokens and user info
    const response = await fetch("/api/oauth/callback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        provider,
        code,
        state,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.message || "OAuth authentication failed")
    }

    const result = await response.json()
    console.log(`[v0] OAuth callback successful for ${provider}:`, result)

    return result.user
  } catch (error) {
    console.error(`[v0] OAuth callback failed for ${provider}:`, error)
    throw error
  }
}

function buildAuthorizationUrl(provider: string, config: OAuthProvider, state: string): string {
  const baseUrls = {
    google: "https://accounts.google.com/o/oauth2/v2/auth",
    facebook: "https://www.facebook.com/v18.0/dialog/oauth",
    twitter: "https://twitter.com/i/oauth2/authorize",
  }

  const baseUrl = baseUrls[provider as keyof typeof baseUrls]
  if (!baseUrl) {
    throw new Error(`Unsupported OAuth provider: ${provider}`)
  }

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    scope: config.scope,
    response_type: "code",
    state: state,
  })

  // Provider-specific parameters
  if (provider === "google") {
    params.append("access_type", "offline")
    params.append("prompt", "consent")
  } else if (provider === "twitter") {
    params.append("code_challenge", "challenge")
    params.append("code_challenge_method", "plain")
  }

  return `${baseUrl}?${params.toString()}`
}

function generateRandomString(length: number): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
  let result = ""
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function storeUser(user: User): void {
  try {
    localStorage.setItem("auth_user", JSON.stringify(user))
  } catch (error) {
    console.error("[v0] Failed to store user:", error)
  }
}
