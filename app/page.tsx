"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Users, Shield, Star, ArrowRight, Briefcase, Globe, Clock, CheckCircle } from "lucide-react"
import { AdContainer } from "@/components/ads/ad-container"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/95 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">W</span>
            </div>
            <span className="text-xl font-bold text-foreground">WorkHub</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/jobs" className="text-muted-foreground hover:text-foreground transition-colors">
              Find Jobs
            </Link>
            <Link href="/marketplace" className="text-muted-foreground hover:text-foreground transition-colors">
              Browse Services
            </Link>
            <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors">
              Help Center
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button className="hover:bg-blue-700 text-white bg-indigo-700">Get Started</Button>
            </Link>
          </div>
        </div>

        <div className="container mx-auto px-4 pb-2">
          <AdContainer placement="header" className="flex justify-center" width={728} height={90} />
        </div>
      </header>

      <section className="py-20 px-4 bg-gradient-to-br from-card via-background to-muted">
        <div className="container mx-auto text-center max-w-4xl">
          <Badge variant="default" className="mb-6 text-sm font-medium">
            🚀 Join 50,000+ professionals worldwide
          </Badge>

          <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight text-balance">
            Connect with skilled professionals for <span className="text-blue-600">microjobs</span> and{" "}
            <span className="text-purple-600">marketplace services</span>
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto text-pretty">
            WorkHub is your trusted platform for finding talented freelancers or offering your expertise. Get quality
            work done efficiently or start earning from your skills today.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/jobs">
              <Button size="lg" className="text-lg px-8 py-6 hover:bg-blue-700 text-white bg-red-500">
                Find Work
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 bg-transparent border-purple-600 text-purple-600 hover:bg-purple-50"
              >
                Browse Services
              </Button>
            </Link>
          </div>

          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-muted-foreground h-5 w-5" />
            <input
              type="text"
              placeholder="Search for services or jobs..."
              className="w-full pl-12 pr-32 py-4 text-lg bg-input border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const query = (e.target as HTMLInputElement).value
                  if (query.trim()) {
                    window.location.href = `/search?q=${encodeURIComponent(query)}`
                  }
                }
              }}
            />
            <Button
              className="absolute right-2 top-2 bottom-2 bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => {
                const input = document.querySelector(
                  'input[placeholder="Search for services or jobs..."]',
                ) as HTMLInputElement
                const query = input?.value
                if (query?.trim()) {
                  window.location.href = `/search?q=${encodeURIComponent(query)}`
                }
              }}
            >
              Search
            </Button>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <AdContainer placement="content" className="flex justify-center" width={728} height={250} />
      </div>

      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">Why choose WorkHub?</h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              We provide a secure, efficient platform for connecting talent with opportunity
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="text-center bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-card-foreground">Verified Professionals</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  All freelancers are verified with skills testing and background checks for quality assurance
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-card-foreground">Secure Payments</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Protected transactions with escrow system and comprehensive dispute resolution
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Clock className="h-6 w-6 text-blue-600" />
                </div>
                <CardTitle className="text-card-foreground">Fast Delivery</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Quick turnaround times with milestone-based project management and real-time updates
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="text-center bg-card border-border hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                  <Star className="h-6 w-6 text-purple-600" />
                </div>
                <CardTitle className="text-card-foreground">Quality Guaranteed</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-muted-foreground">
                  Comprehensive rating system and satisfaction guarantee ensure exceptional results
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4 text-balance">
              Two ways to succeed on WorkHub
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto text-pretty">
              Whether you're looking for talent or offering services, we've got you covered
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Jobs Section */}
            <Card className="p-8 bg-card border-border">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-card-foreground">Find Jobs</h3>
                  <p className="text-muted-foreground">Browse thousands of opportunities</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">Diverse Job Categories</p>
                    <p className="text-sm text-muted-foreground">From design to development, writing to marketing</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">Flexible Work Arrangements</p>
                    <p className="text-sm text-muted-foreground">Remote, part-time, or project-based opportunities</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">Competitive Rates</p>
                    <p className="text-sm text-muted-foreground">Fair compensation for quality work</p>
                  </div>
                </div>
              </div>

              <Link href="/jobs">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  Browse Jobs
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>

            {/* Marketplace Section */}
            <Card className="p-8 bg-card border-border">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mr-4">
                  <Globe className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-card-foreground">Marketplace Services</h3>
                  <p className="text-muted-foreground">Ready-to-buy professional services</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">Pre-packaged Services</p>
                    <p className="text-sm text-muted-foreground">Clear deliverables and fixed pricing</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">Instant Ordering</p>
                    <p className="text-sm text-muted-foreground">Quick purchase and fast delivery</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-card-foreground">Expert Providers</p>
                    <p className="text-sm text-muted-foreground">Vetted professionals with proven track records</p>
                  </div>
                </div>
              </div>

              <Link href="/marketplace">
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                  Browse Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20 px-4 bg-blue-600">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 text-balance">Ready to get started?</h2>
          <p className="text-lg md:text-xl text-blue-100 mb-8 max-w-2xl mx-auto text-pretty">
            Join thousands of professionals who trust WorkHub for their projects and career growth
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-6 bg-white text-blue-600 hover:bg-blue-50">
              Create Your Account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-card text-card-foreground py-12 px-4 border-t border-border">
        <div className="container mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <Link href="/" className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">W</span>
                </div>
                <span className="text-xl font-bold text-card-foreground">WorkHub</span>
              </Link>
              <p className="text-muted-foreground">Connecting talent with opportunity worldwide</p>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-card-foreground">For Clients</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/dashboard/jobs/create" className="hover:text-card-foreground transition-colors">
                    Post a Job
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace" className="hover:text-card-foreground transition-colors">
                    Browse Services
                  </Link>
                </li>
                <li>
                  <Link href="/help" className="hover:text-card-foreground transition-colors">
                    How it Works
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-card-foreground">For Freelancers</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/jobs" className="hover:text-card-foreground transition-colors">
                    Find Jobs
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard/profile" className="hover:text-card-foreground transition-colors">
                    Create Profile
                  </Link>
                </li>
                <li>
                  <Link href="/marketplace/new" className="hover:text-card-foreground transition-colors">
                    Sell Services
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold mb-4 text-card-foreground">Support</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <Link href="/help" className="hover:text-card-foreground transition-colors">
                    Help Center
                  </Link>
                </li>
                <li>
                  <Link href="/help?tab=contact" className="hover:text-card-foreground transition-colors">
                    Contact Us
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-card-foreground transition-colors">
                    Terms of Service
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border mt-8 pt-8 text-center text-muted-foreground">
            <p>&copy; 2024 WorkHub. All rights reserved.</p>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <AdContainer placement="footer" className="flex justify-center" width={728} height={90} />
          </div>
        </div>
      </footer>
    </div>
  )
}
