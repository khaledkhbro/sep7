import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { provider, code, state } = await request.json()

    if (!provider || !code) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 })
    }

    console.log(`[v0] Processing OAuth callback for ${provider}`)

    // Exchange authorization code for access token
    const tokenData = await exchangeCodeForToken(provider, code)

    // Get user information from OAuth provider
    const userInfo = await getUserInfo(provider, tokenData.access_token)

    // Create or update user in database
    const user = await createOrUpdateOAuthUser(provider, userInfo, tokenData)

    return NextResponse.json({
      success: true,
      user,
      message: "OAuth authentication successful",
    })
  } catch (error) {
    console.error("[v0] OAuth callback error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "OAuth authentication failed" },
      { status: 500 },
    )
  }
}

async function exchangeCodeForToken(provider: string, code: string) {
  const tokenUrls = {
    google: "https://oauth2.googleapis.com/token",
    facebook: "https://graph.facebook.com/v18.0/oauth/access_token",
    twitter: "https://api.twitter.com/2/oauth2/token",
  }

  const tokenUrl = tokenUrls[provider as keyof typeof tokenUrls]
  if (!tokenUrl) {
    throw new Error(`Unsupported provider: ${provider}`)
  }

  const clientId = getClientId(provider)
  const clientSecret = getClientSecret(provider)
  const redirectUri = getRedirectUri(provider)

  const params = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    code,
  })

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: params.toString(),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Token exchange failed: ${error}`)
  }

  return await response.json()
}

async function getUserInfo(provider: string, accessToken: string) {
  const userInfoUrls = {
    google: "https://www.googleapis.com/oauth2/v2/userinfo",
    facebook: "https://graph.facebook.com/me?fields=id,name,email,first_name,last_name,picture",
    twitter: "https://api.twitter.com/2/users/me?user.fields=profile_image_url",
  }

  const userInfoUrl = userInfoUrls[provider as keyof typeof userInfoUrls]
  if (!userInfoUrl) {
    throw new Error(`Unsupported provider: ${provider}`)
  }

  const response = await fetch(userInfoUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Failed to get user info: ${error}`)
  }

  const data = await response.json()

  // Normalize user data across providers
  return normalizeUserInfo(provider, data)
}

function normalizeUserInfo(provider: string, data: any) {
  switch (provider) {
    case "google":
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        firstName: data.given_name,
        lastName: data.family_name,
        picture: data.picture,
        provider: "google",
      }
    case "facebook":
      return {
        id: data.id,
        email: data.email,
        name: data.name,
        firstName: data.first_name,
        lastName: data.last_name,
        picture: data.picture?.data?.url,
        provider: "facebook",
      }
    case "twitter":
      return {
        id: data.data.id,
        email: data.data.email || "",
        name: data.data.name,
        firstName: data.data.name?.split(" ")[0] || "",
        lastName: data.data.name?.split(" ").slice(1).join(" ") || "",
        picture: data.data.profile_image_url,
        provider: "twitter",
      }
    default:
      throw new Error(`Unsupported provider: ${provider}`)
  }
}

async function createOrUpdateOAuthUser(provider: string, userInfo: any, tokenData: any) {
  // This would typically interact with your database
  // For now, return a mock user object
  const user = {
    id: `oauth_${provider}_${userInfo.id}`,
    email: userInfo.email,
    firstName: userInfo.firstName,
    lastName: userInfo.lastName,
    username: userInfo.email?.split("@")[0] || `${provider}_user`,
    fullName: userInfo.name,
    profilePicture: userInfo.picture,
    isVerified: true,
    isActive: true,
    userType: "user",
    oauthProvider: provider,
    oauthId: userInfo.id,
    createdAt: new Date().toISOString(),
  }

  console.log(`[v0] Created/updated OAuth user for ${provider}:`, user)
  return user
}

function getClientId(provider: string): string {
  const clientIds = {
    google: process.env.GOOGLE_CLIENT_ID,
    facebook: process.env.FACEBOOK_APP_ID,
    twitter: process.env.TWITTER_CLIENT_ID,
  }

  const clientId = clientIds[provider as keyof typeof clientIds]
  if (!clientId) {
    throw new Error(`Client ID not configured for ${provider}`)
  }

  return clientId
}

function getClientSecret(provider: string): string {
  const clientSecrets = {
    google: process.env.GOOGLE_CLIENT_SECRET,
    facebook: process.env.FACEBOOK_APP_SECRET,
    twitter: process.env.TWITTER_CLIENT_SECRET,
  }

  const clientSecret = clientSecrets[provider as keyof typeof clientSecrets]
  if (!clientSecret) {
    throw new Error(`Client secret not configured for ${provider}`)
  }

  return clientSecret
}

function getRedirectUri(provider: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
  return `${baseUrl}/api/oauth/callback/${provider}`
}
