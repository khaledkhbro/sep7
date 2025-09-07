"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Search, MessageCircle, Mail, Phone, HelpCircle, FileText, Shield } from "lucide-react"
import Link from "next/link"

const faqData = [
  {
    category: "Getting Started",
    questions: [
      {
        question: "How do I create an account?",
        answer:
          "Click 'Get Started' on the homepage, fill out the registration form with your email and password, then verify your email address to activate your account.",
      },
      {
        question: "What's the difference between jobs and services?",
        answer:
          "Jobs are posted by clients looking for specific work to be done. Services are pre-packaged offerings created by freelancers that clients can purchase directly.",
      },
      {
        question: "How do I get verified?",
        answer:
          "Complete your profile, upload a profile photo, add your skills and portfolio, then contact support to request verification. Verified users get a blue checkmark and higher visibility.",
      },
    ],
  },
  {
    category: "Payments & Fees",
    questions: [
      {
        question: "What fees does the platform charge?",
        answer:
          "We charge a 5% platform fee on completed transactions. This covers payment processing, dispute resolution, and platform maintenance.",
      },
      {
        question: "How do I withdraw my earnings?",
        answer:
          "Go to your wallet, click 'Withdraw', enter the amount (minimum $10), and choose your preferred payment method. Withdrawals are processed within 1-3 business days.",
      },
      {
        question: "What payment methods are accepted?",
        answer:
          "We accept major credit cards, PayPal, and bank transfers. All payments are processed securely through our payment partners.",
      },
    ],
  },
  {
    category: "Safety & Security",
    questions: [
      {
        question: "How do you protect against fraud?",
        answer:
          "We use identity verification, review systems, and 24/7 monitoring to protect both clients and freelancers from fraudulent activity.",
      },
      {
        question: "What if I have a dispute?",
        answer:
          "Contact our support team immediately. We offer mediation services and can help resolve disputes fairly between clients and freelancers.",
      },
      {
        question: "Is my personal information safe?",
        answer:
          "Yes, we use industry-standard encryption and never share your personal information with third parties without your consent.",
      },
    ],
  },
]

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [contactForm, setContactForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  })

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Handle contact form submission
    alert("Thank you for your message! We'll get back to you within 24 hours.")
    setContactForm({ name: "", email: "", subject: "", message: "" })
  }

  const filteredFAQ = faqData
    .map((category) => ({
      ...category,
      questions: category.questions.filter(
        (q) =>
          searchQuery === "" ||
          q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          q.answer.toLowerCase().includes(searchQuery.toLowerCase()),
      ),
    }))
    .filter((category) => category.questions.length > 0)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 flex items-center justify-center">
              <HelpCircle className="mr-3 h-8 w-8 text-blue-600" />
              Help Center
            </h1>
            <p className="text-gray-600 mb-6">Find answers to common questions or get in touch with our support team</p>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <Input
                placeholder="Search for help articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 text-lg"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="faq" className="space-y-8">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="faq">FAQ</TabsTrigger>
            <TabsTrigger value="contact">Contact Us</TabsTrigger>
            <TabsTrigger value="guides">Guides</TabsTrigger>
            <TabsTrigger value="policies">Policies</TabsTrigger>
          </TabsList>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <div className="space-y-6">
              {filteredFAQ.map((category, categoryIndex) => (
                <Card key={categoryIndex}>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Badge variant="outline" className="mr-3">
                        {category.category}
                      </Badge>
                      {category.questions.length} questions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                      {category.questions.map((item, index) => (
                        <AccordionItem key={index} value={`item-${categoryIndex}-${index}`}>
                          <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
                          <AccordionContent className="text-gray-600">{item.answer}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </CardContent>
                </Card>
              ))}

              {filteredFAQ.length === 0 && searchQuery && (
                <div className="text-center py-12">
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No results found</h3>
                  <p className="text-gray-600 mb-4">Try different keywords or contact our support team</p>
                  <Button>Contact Support</Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Contact Tab */}
          <TabsContent value="contact">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <MessageCircle className="mr-2 h-5 w-5 text-blue-600" />
                    Send us a message
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleContactSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">Name *</label>
                        <Input
                          value={contactForm.name}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-700">Email *</label>
                        <Input
                          type="email"
                          value={contactForm.email}
                          onChange={(e) => setContactForm((prev) => ({ ...prev, email: e.target.value }))}
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Subject *</label>
                      <Input
                        value={contactForm.subject}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, subject: e.target.value }))}
                        required
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-700">Message *</label>
                      <Textarea
                        rows={6}
                        value={contactForm.message}
                        onChange={(e) => setContactForm((prev) => ({ ...prev, message: e.target.value }))}
                        required
                      />
                    </div>
                    <Button type="submit" className="w-full">
                      Send Message
                    </Button>
                  </form>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Mail className="mr-2 h-5 w-5 text-green-600" />
                      Email Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-3">Get help via email. We typically respond within 24 hours.</p>
                    <p className="font-medium">support@workhub.com</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Phone className="mr-2 h-5 w-5 text-purple-600" />
                      Phone Support
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 mb-3">Speak with our support team directly.</p>
                    <p className="font-medium">+1 (555) 123-4567</p>
                    <p className="text-sm text-gray-500 mt-1">Monday - Friday, 9 AM - 6 PM EST</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Response Times</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email Support:</span>
                      <span className="font-medium">24 hours</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Phone Support:</span>
                      <span className="font-medium">Immediate</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Live Chat:</span>
                      <span className="font-medium">5 minutes</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Guides Tab */}
          <TabsContent value="guides">
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Getting Started Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Complete guide to setting up your account and getting your first job or client.
                  </p>
                  <Badge variant="secondary">Beginner</Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Freelancer Success Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Best practices for creating compelling profiles and winning more projects.
                  </p>
                  <Badge variant="secondary">Intermediate</Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Client Hiring Guide</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    How to post effective job listings and find the right freelancers.
                  </p>
                  <Badge variant="secondary">Beginner</Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Payment & Billing</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Understanding fees, payments, withdrawals, and tax considerations.
                  </p>
                  <Badge variant="secondary">All Levels</Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Safety & Security</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">How to stay safe, avoid scams, and protect your account.</p>
                  <Badge variant="secondary">Important</Badge>
                </CardContent>
              </Card>

              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-lg">Advanced Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">Make the most of analytics, team features, and API integrations.</p>
                  <Badge variant="secondary">Advanced</Badge>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Policies Tab */}
          <TabsContent value="policies">
            <div className="grid md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <FileText className="mr-2 h-5 w-5 text-blue-600" />
                    Terms of Service
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Our terms and conditions for using the platform, including user responsibilities and platform rules.
                  </p>
                  <Link href="/terms">
                    <Button variant="outline" className="bg-transparent">
                      Read Terms of Service
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="mr-2 h-5 w-5 text-green-600" />
                    Privacy Policy
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    How we collect, use, and protect your personal information and data.
                  </p>
                  <Link href="/privacy">
                    <Button variant="outline" className="bg-transparent">
                      Read Privacy Policy
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Community Guidelines</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Standards for behavior and content to maintain a professional, respectful community.
                  </p>
                  <Button variant="outline" className="bg-transparent">
                    View Guidelines
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Dispute Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 mb-4">
                    Our process for handling disputes between clients and freelancers fairly and efficiently.
                  </p>
                  <Button variant="outline" className="bg-transparent">
                    Learn More
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
