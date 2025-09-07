"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Star, MapPin, Verified, MessageCircle, ExternalLink, Plane } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import Link from "next/link"
import { ReviewDisplay } from "@/components/reviews/review-display"
import { useMarketplace } from "@/components/marketplace/marketplace-provider"

interface PublicProfile {
  id: string
  username: string
  firstName: string
  lastName: string
  bio: string
  location: string
  joinedAt: string
  isVerified: boolean
  rating: number
  totalReviews: number
  totalEarned: number
  completedJobs: number
  skills: string[]
  portfolio: {
    id: string
    title: string
    description: string
    imageUrl: string
    projectUrl?: string
    tags: string[]
    createdAt: string
  }[]
  services: {
    id: string
    title: string
    price: number
    rating: number
    totalOrders: number
    imageUrl: string
  }[]
  reviews: {
    id: string
    rating: number
    comment: string
    clientName: string
    projectTitle: string
    createdAt: string
  }[]
}

const mockProfile: PublicProfile = {
  id: "1",
  username: "sarah_designer",
  firstName: "Sarah",
  lastName: "Johnson",
  bio: "Creative UI/UX designer with 5+ years of experience in web and mobile design. I specialize in creating beautiful, user-friendly interfaces that drive engagement and conversions. Let's bring your vision to life!",
  location: "San Francisco, CA",
  joinedAt: "2023-01-15T10:00:00Z",
  isVerified: true,
  rating: 4.9,
  totalReviews: 127,
  totalEarned: 45000,
  completedJobs: 89,
  skills: ["UI/UX Design", "Figma", "Adobe XD", "Prototyping", "User Research", "Wireframing", "React", "CSS"],
  portfolio: [
    {
      id: "1",
      title: "E-commerce Mobile App",
      description: "Complete UI/UX design for a fashion e-commerce mobile application with modern, clean interface.",
      imageUrl: "/mobile-app-design-concept.png",
      projectUrl: "https://dribbble.com/shots/example",
      tags: ["Mobile Design", "E-commerce", "Figma"],
      createdAt: "2024-01-10T10:00:00Z",
    },
    {
      id: "2",
      title: "SaaS Dashboard Design",
      description: "Dashboard design for a project management SaaS platform with complex data visualization.",
      imageUrl: "/modern-data-dashboard.png",
      tags: ["Web Design", "Dashboard", "Data Viz"],
      createdAt: "2024-01-05T10:00:00Z",
    },
    {
      id: "3",
      title: "Brand Identity Package",
      description: "Complete brand identity including logo, color palette, typography, and brand guidelines.",
      imageUrl: "/brand-identity-concept.png",
      tags: ["Branding", "Logo Design", "Identity"],
      createdAt: "2023-12-20T10:00:00Z",
    },
  ],
  services: [
    {
      id: "1",
      title: "Custom Website Design",
      price: 500,
      rating: 4.9,
      totalOrders: 45,
      imageUrl: "/website-design-concept.png",
    },
    {
      id: "2",
      title: "Mobile App UI Design",
      price: 750,
      rating: 5.0,
      totalOrders: 32,
      imageUrl: "/mobile-app-ui.png",
    },
  ],
  reviews: [
    {
      id: "1",
      rating: 5,
      comment:
        "Sarah delivered exceptional work on our e-commerce redesign. Her attention to detail and understanding of user experience is outstanding. Highly recommended!",
      clientName: "Mike Chen",
      projectTitle: "E-commerce Website Redesign",
      createdAt: "2024-01-15T10:00:00Z",
    },
    {
      id: "2",
      rating: 5,
      comment:
        "Professional, creative, and delivered exactly what we needed. The mobile app design exceeded our expectations.",
      clientName: "Lisa Rodriguez",
      projectTitle: "Mobile App Design",
      createdAt: "2024-01-10T10:00:00Z",
    },
  ],
}

export default function PublicProfilePage() {
  const params = useParams()
  const [profile, setProfile] = useState<PublicProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const { isUserInVacationMode } = useMarketplace()

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true)
      try {
        await new Promise((resolve) => setTimeout(resolve, 500))
        setProfile(mockProfile)
      } catch (error) {
        console.error("Failed to load profile:", error)
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [params.username])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Profile not found</h1>
          <p className="text-gray-600 mb-4">The user profile you're looking for doesn't exist.</p>
          <Link href="/marketplace">
            <Button>Browse Services</Button>
          </Link>
        </div>
      </div>
    )
  }

  const isInVacationMode = isUserInVacationMode(profile.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Profile Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Basic Info */}
            <Card>
              <CardContent className="p-6 text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4">
                  <AvatarFallback className="text-2xl">
                    {profile.firstName[0]}
                    {profile.lastName[0]}
                  </AvatarFallback>
                </Avatar>

                <div className="flex items-center justify-center space-x-2 mb-2">
                  <h1 className="text-xl font-bold text-gray-900">
                    {profile.firstName} {profile.lastName}
                  </h1>
                  {profile.isVerified && <Verified className="h-5 w-5 text-blue-500" />}
                </div>

                <p className="text-gray-600 mb-1">@{profile.username}</p>

                {isInVacationMode && (
                  <div className="flex items-center justify-center space-x-2 mb-3 text-orange-600">
                    <Plane className="h-4 w-4" />
                    <span className="text-sm font-medium">On Vacation</span>
                  </div>
                )}

                <div className="flex items-center justify-center space-x-1 mb-4">
                  <Star className="h-4 w-4 text-yellow-400 fill-current" />
                  <span className="font-medium">{profile.rating}</span>
                  <span className="text-gray-500">({profile.totalReviews} reviews)</span>
                </div>

                <div className="flex items-center justify-center text-gray-600 mb-4">
                  <MapPin className="h-4 w-4 mr-1" />
                  {profile.location}
                </div>

                <Button className="w-full mb-2" disabled={isInVacationMode}>
                  <MessageCircle className="mr-2 h-4 w-4" />
                  {isInVacationMode ? "Currently Unavailable" : "Contact Me"}
                </Button>

                <p className="text-xs text-gray-500">
                  Member since {formatDistanceToNow(new Date(profile.joinedAt), { addSuffix: true })}
                </p>
              </CardContent>
            </Card>

            {/* Stats */}
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Earned:</span>
                  <span className="font-medium">${profile.totalEarned.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Completed Jobs:</span>
                  <span className="font-medium">{profile.completedJobs}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Success Rate:</span>
                  <span className="font-medium">98%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium">&lt; 1 hour</span>
                </div>
              </CardContent>
            </Card>

            {/* Skills */}
            <Card>
              <CardHeader>
                <CardTitle>Skills</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill) => (
                    <Badge key={skill} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-2">
            <Tabs defaultValue="about" className="space-y-6">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="about">About</TabsTrigger>
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="services" disabled={isInVacationMode}>
                  Services
                </TabsTrigger>
                <TabsTrigger value="reviews">Reviews</TabsTrigger>
              </TabsList>

              {/* About Tab */}
              <TabsContent value="about">
                <Card>
                  <CardHeader>
                    <CardTitle>About Me</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">{profile.bio}</p>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Portfolio Tab */}
              <TabsContent value="portfolio">
                <div className="space-y-6">
                  {profile.portfolio.map((item) => (
                    <Card key={item.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-0">
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="aspect-video md:aspect-square">
                            <img
                              src={item.imageUrl || "/placeholder.svg"}
                              alt={item.title}
                              className="w-full h-full object-cover rounded-l-lg"
                            />
                          </div>
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <h3 className="text-xl font-semibold text-gray-900">{item.title}</h3>
                              {item.projectUrl && (
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={item.projectUrl} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                            <p className="text-gray-600 mb-4">{item.description}</p>
                            <div className="flex flex-wrap gap-2 mb-3">
                              {item.tags.map((tag) => (
                                <Badge key={tag} variant="outline">
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            <p className="text-sm text-gray-500">
                              {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Services Tab */}
              <TabsContent value="services">
                {isInVacationMode ? (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardContent className="p-8 text-center">
                      <Plane className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-orange-800 mb-2">Services Currently Unavailable</h3>
                      <p className="text-orange-700">
                        This seller is currently on vacation and their services are temporarily hidden.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid md:grid-cols-2 gap-6">
                    {profile.services.map((service) => (
                      <Card key={service.id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-0">
                          <div className="aspect-video">
                            <img
                              src={service.imageUrl || "/placeholder.svg"}
                              alt={service.title}
                              className="w-full h-full object-cover rounded-t-lg"
                            />
                          </div>
                          <div className="p-4">
                            <h3 className="font-semibold text-gray-900 mb-2">{service.title}</h3>
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-1">
                                <Star className="h-4 w-4 text-yellow-400 fill-current" />
                                <span className="text-sm font-medium">{service.rating}</span>
                                <span className="text-sm text-gray-500">({service.totalOrders})</span>
                              </div>
                              <span className="text-lg font-bold text-green-600">${service.price}</span>
                            </div>
                            <Link href={`/marketplace/${service.id}`}>
                              <Button className="w-full" size="sm">
                                View Service
                              </Button>
                            </Link>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              {/* Reviews Tab */}
              <TabsContent value="reviews">
                <ReviewDisplay userId={profile.id} showTitle={false} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  )
}
