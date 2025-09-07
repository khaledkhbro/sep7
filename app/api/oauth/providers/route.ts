import { NextResponse } from "next/server"

export async function GET() {
  try {
    // In a real implementation, this would fetch from your database
    // For now, return mock data based on admin settings
    const providers = [
      {
        name: "google",
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/callback/google`,
        scope: "openid email profile",
        isEnabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
      },
      {
        name: "facebook",
        clientId: process.env.FACEBOOK_APP_ID || "",
        clientSecret: process.env.FACEBOOK_APP_SECRET || "",
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/callback/facebook`,
        scope: "email public_profile",
        isEnabled: !!(process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET),
      },
      {
        name: "twitter",
        clientId: process.env.TWITTER_CLIENT_ID || "",
        clientSecret: process.env.TWITTER_CLIENT_SECRET || "",
        redirectUri: `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/oauth/callback/twitter`,
        scope: "users.read tweet.read",
        isEnabled: !!(process.env.TWITTER_CLIENT_ID && process.env.TWITTER_CLIENT_SECRET),
      },
    ]

    // Filter out client secrets from response
    const publicProviders = providers.map(({ clientSecret, ...provider }) => provider)

    return NextResponse.json(publicProviders)
  } catch (error) {
    console.error("[v0] Failed to get OAuth providers:", error)
    return NextResponse.json({ error: "Failed to get OAuth providers" }, { status: 500 })
  }
}
