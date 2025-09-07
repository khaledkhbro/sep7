import { type NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/local-redis"

interface AdminService {
  id: string
  name: string
  description: string
  price: number
  deliveryTime: number
  deliveryUnit: string
  revisions: number
  unlimitedRevisions: boolean
  images: string[]
  videoUrl?: string
  sortOrder: number
}

interface AdminSubcategory {
  id: string
  name: string
  description: string
  services: AdminService[]
  sortOrder: number
}

interface AdminCategory {
  id: string
  name: string
  description: string
  logo: string
  subcategories: AdminSubcategory[]
  sortOrder: number
}

const CACHE_KEY = "marketplace:categories"
const CACHE_TTL = 3600 // 1 hour

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const refresh = searchParams.get("refresh") === "true"

    // Try to get from Redis cache first (unless refresh is requested)
    if (!refresh) {
      const cached = await redis.get(CACHE_KEY)
      if (cached) {
        console.log("[v0] Categories served from Redis cache")
        return NextResponse.json({
          categories: JSON.parse(cached),
          cached: true,
        })
      }
    } else {
      console.log("[v0] Cache refresh requested, bypassing Redis cache")
    }

    // If not in cache, get from localStorage (server-side simulation)
    let categories: AdminCategory[] = []

    // In a real app, this would come from a database
    // For now, we'll use the default structure
    const defaultCategories: AdminCategory[] = [
      {
        id: "graphics-design",
        name: "Graphics & Design",
        description: "Logo & Brand Identity, Art & Illustration, Web & App Design",
        logo: "/placeholder.svg?height=100&width=100&text=Graphics",
        sortOrder: 1,
        subcategories: [
          {
            id: "logo-design",
            name: "Logo Design",
            description: "Professional logo design services",
            sortOrder: 1,
            services: [
              {
                id: "logo-design-service",
                name: "Logo Design",
                description: "Custom logo design services",
                price: 150,
                deliveryTime: 3,
                deliveryUnit: "days",
                revisions: 3,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Logo+Design"],
                sortOrder: 1,
              },
              {
                id: "logo-redesign",
                name: "Logo Redesign",
                description: "Modernize your existing logo",
                price: 120,
                deliveryTime: 2,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Logo+Redesign"],
                sortOrder: 2,
              },
            ],
          },
          {
            id: "brand-identity",
            name: "Brand Identity & Guidelines",
            description: "Complete brand identity packages",
            sortOrder: 2,
            services: [
              {
                id: "brand-package",
                name: "Brand Package",
                description: "Complete brand identity package",
                price: 500,
                deliveryTime: 7,
                deliveryUnit: "days",
                revisions: 3,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Brand+Package"],
                sortOrder: 1,
              },
            ],
          },
          {
            id: "web-app-design",
            name: "Web & App Design",
            description: "UI/UX design for websites and mobile apps",
            sortOrder: 3,
            services: [
              {
                id: "ui-ux-design",
                name: "UI/UX Design",
                description: "Modern user interface and experience design",
                price: 400,
                deliveryTime: 5,
                deliveryUnit: "days",
                revisions: 3,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=UI+UX+Design"],
                sortOrder: 1,
              },
            ],
          },
        ],
      },
      {
        id: "web-development",
        name: "Web Development",
        description: "Website Development, E-commerce, Mobile Apps",
        logo: "/placeholder.svg?height=100&width=100&text=Web",
        sortOrder: 2,
        subcategories: [
          {
            id: "website-development",
            name: "Website Development",
            description: "Custom website development services",
            sortOrder: 1,
            services: [
              {
                id: "react-website",
                name: "React Website",
                description: "Modern React website development",
                price: 800,
                deliveryTime: 7,
                deliveryUnit: "days",
                revisions: 3,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=React+Website"],
                sortOrder: 1,
              },
              {
                id: "wordpress-website",
                name: "WordPress Website",
                description: "Custom WordPress development",
                price: 600,
                deliveryTime: 5,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=WordPress+Site"],
                sortOrder: 2,
              },
            ],
          },
          {
            id: "ecommerce-development",
            name: "E-commerce Development",
            description: "Online store development and setup",
            sortOrder: 2,
            services: [
              {
                id: "shopify-store",
                name: "Shopify Store Setup",
                description: "Complete Shopify store development",
                price: 700,
                deliveryTime: 6,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Shopify+Store"],
                sortOrder: 1,
              },
            ],
          },
        ],
      },
      {
        id: "writing-translation",
        name: "Writing & Translation",
        description: "Content Writing, Copywriting, Translation Services",
        logo: "/placeholder.svg?height=100&width=100&text=Writing",
        sortOrder: 3,
        subcategories: [
          {
            id: "content-writing",
            name: "Content Writing",
            description: "Blog posts, articles, and web content",
            sortOrder: 1,
            services: [
              {
                id: "blog-writing",
                name: "Blog Writing",
                description: "SEO-optimized blog posts and articles",
                price: 75,
                deliveryTime: 2,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Blog+Writing"],
                sortOrder: 1,
              },
              {
                id: "copywriting",
                name: "Copywriting",
                description: "Sales copy and marketing content",
                price: 100,
                deliveryTime: 3,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Copywriting"],
                sortOrder: 2,
              },
            ],
          },
          {
            id: "translation",
            name: "Translation Services",
            description: "Professional translation in multiple languages",
            sortOrder: 2,
            services: [
              {
                id: "document-translation",
                name: "Document Translation",
                description: "Accurate document translation services",
                price: 50,
                deliveryTime: 2,
                deliveryUnit: "days",
                revisions: 1,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Translation"],
                sortOrder: 1,
              },
            ],
          },
        ],
      },
      {
        id: "digital-marketing",
        name: "Digital Marketing",
        description: "SEO, Social Media Marketing, PPC Advertising",
        logo: "/placeholder.svg?height=100&width=100&text=Marketing",
        sortOrder: 4,
        subcategories: [
          {
            id: "seo",
            name: "SEO",
            description: "Search engine optimization services",
            sortOrder: 1,
            services: [
              {
                id: "seo-audit",
                name: "SEO Audit",
                description: "Comprehensive website SEO analysis",
                price: 200,
                deliveryTime: 3,
                deliveryUnit: "days",
                revisions: 1,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=SEO+Audit"],
                sortOrder: 1,
              },
            ],
          },
          {
            id: "social-media",
            name: "Social Media Marketing",
            description: "Social media strategy and management",
            sortOrder: 2,
            services: [
              {
                id: "social-media-management",
                name: "Social Media Management",
                description: "Monthly social media content and posting",
                price: 300,
                deliveryTime: 30,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Social+Media"],
                sortOrder: 1,
              },
            ],
          },
        ],
      },
      {
        id: "video-animation",
        name: "Video & Animation",
        description: "Video Editing, Animation, Motion Graphics",
        logo: "/placeholder.svg?height=100&width=100&text=Video",
        sortOrder: 5,
        subcategories: [
          {
            id: "video-editing",
            name: "Video Editing",
            description: "Professional video editing services",
            sortOrder: 1,
            services: [
              {
                id: "youtube-video-editing",
                name: "YouTube Video Editing",
                description: "Professional YouTube video editing",
                price: 150,
                deliveryTime: 3,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Video+Editing"],
                sortOrder: 1,
              },
            ],
          },
          {
            id: "animation",
            name: "Animation",
            description: "2D and 3D animation services",
            sortOrder: 2,
            services: [
              {
                id: "2d-animation",
                name: "2D Animation",
                description: "Custom 2D animation creation",
                price: 400,
                deliveryTime: 7,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=2D+Animation"],
                sortOrder: 1,
              },
            ],
          },
        ],
      },
      {
        id: "music-audio",
        name: "Music & Audio",
        description: "Voice Over, Music Production, Audio Editing",
        logo: "/placeholder.svg?height=100&width=100&text=Audio",
        sortOrder: 6,
        subcategories: [
          {
            id: "voice-over",
            name: "Voice Over",
            description: "Professional voice over services",
            sortOrder: 1,
            services: [
              {
                id: "commercial-voice-over",
                name: "Commercial Voice Over",
                description: "Professional voice over for commercials",
                price: 100,
                deliveryTime: 2,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Voice+Over"],
                sortOrder: 1,
              },
            ],
          },
        ],
      },
      {
        id: "programming-tech",
        name: "Programming & Tech",
        description: "Software Development, Data Science, Cybersecurity",
        logo: "/placeholder.svg?height=100&width=100&text=Programming",
        sortOrder: 7,
        subcategories: [
          {
            id: "software-development",
            name: "Software Development",
            description: "Custom software and application development",
            sortOrder: 1,
            services: [
              {
                id: "python-development",
                name: "Python Development",
                description: "Custom Python application development",
                price: 500,
                deliveryTime: 7,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Python+Dev"],
                sortOrder: 1,
              },
            ],
          },
        ],
      },
      {
        id: "business",
        name: "Business",
        description: "Business Plans, Market Research, Project Management",
        logo: "/placeholder.svg?height=100&width=100&text=Business",
        sortOrder: 8,
        subcategories: [
          {
            id: "business-plans",
            name: "Business Plans",
            description: "Professional business plan creation",
            sortOrder: 1,
            services: [
              {
                id: "startup-business-plan",
                name: "Startup Business Plan",
                description: "Comprehensive business plan for startups",
                price: 300,
                deliveryTime: 5,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Business+Plan"],
                sortOrder: 1,
              },
            ],
          },
        ],
      },
      {
        id: "lifestyle",
        name: "Lifestyle",
        description: "Gaming, Travel, Fitness, Relationship Advice",
        logo: "/placeholder.svg?height=100&width=100&text=Lifestyle",
        sortOrder: 9,
        subcategories: [
          {
            id: "fitness",
            name: "Fitness",
            description: "Personal training and fitness coaching",
            sortOrder: 1,
            services: [
              {
                id: "workout-plan",
                name: "Custom Workout Plan",
                description: "Personalized fitness and workout plans",
                price: 80,
                deliveryTime: 3,
                deliveryUnit: "days",
                revisions: 1,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=Workout+Plan"],
                sortOrder: 1,
              },
            ],
          },
        ],
      },
      {
        id: "ai-services",
        name: "AI Services",
        description: "AI Development, Machine Learning, Chatbots",
        logo: "/placeholder.svg?height=100&width=100&text=AI",
        sortOrder: 10,
        subcategories: [
          {
            id: "ai-development",
            name: "AI Development",
            description: "Custom AI and machine learning solutions",
            sortOrder: 1,
            services: [
              {
                id: "chatbot-development",
                name: "Chatbot Development",
                description: "Custom AI chatbot development",
                price: 600,
                deliveryTime: 7,
                deliveryUnit: "days",
                revisions: 2,
                unlimitedRevisions: false,
                images: ["/placeholder.svg?height=300&width=400&text=AI+Chatbot"],
                sortOrder: 1,
              },
            ],
          },
        ],
      },
    ]

    categories = defaultCategories

    // Cache the result in Redis
    await redis.set(CACHE_KEY, JSON.stringify(categories), CACHE_TTL)
    console.log("[v0] Categories cached in Redis for", CACHE_TTL, "seconds")

    return NextResponse.json({
      categories,
      cached: false,
    })
  } catch (error) {
    console.error("[v0] Error fetching categories:", error)
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const categories = await request.json()

    // Save to cache
    await redis.set(CACHE_KEY, JSON.stringify(categories), CACHE_TTL)
    console.log("[v0] Categories updated in Redis cache")

    // In a real app, you would also save to database here

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating categories:", error)
    return NextResponse.json({ error: "Failed to update categories" }, { status: 500 })
  }
}

// Clear cache endpoint
export async function DELETE() {
  try {
    await redis.del(CACHE_KEY)
    console.log("[v0] Categories cache cleared")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error clearing cache:", error)
    return NextResponse.json({ error: "Failed to clear cache" }, { status: 500 })
  }
}
