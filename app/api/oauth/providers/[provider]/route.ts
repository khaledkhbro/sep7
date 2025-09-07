import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest, { params }: { params: { provider: string } }) {
  try {
    const { provider } = params

    const providerConfigs = {
      google: {
        name: "google",
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/callback/google`,
        scope: "openid email profile",
        isEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      facebook: {
        name: "facebook",
        clientId: process.env.FACEBOOK_APP_ID || "",
        clientSecret: process.env.FACEBOOK_APP_SECRET || "",
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/callback/facebook`,
        scope: "email public_profile",
        isEnabled: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      },
      twitter: {
        name: "twitter",
        clientId: process.env.TWITTER_CLIENT_ID || "",
        clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/callback/twitter`,
        scope: "users.read tweet.read",
        isEnabled: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
      },
    }

    const config = providerConfigs[provider as keyof typeof providerConfigs]
    if (!config) {
      return NextResponse.json({ error: "Provider not found" }, { status: 404 })
    }

    // Remove client secret from response
    const { clientSecret, ...publicConfig } = config

    return NextResponse.json(publicConfig)
  } catch (error) {
    console.error(`[v0] Failed to get OAuth provider ${params.provider}:`, error)
    return NextResponse.json({ error: "Failed to get OAuth provider" }, { status: 500 })
  }
}
