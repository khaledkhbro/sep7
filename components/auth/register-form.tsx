"use client"

import type React from "react"

import { useState, useEffect, useCallback, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useAuth } from "@/contexts/auth-context"
import { Loader2, Mail, Lock, User, Eye, EyeOff, Gift, Globe, Phone, ChevronDown } from "lucide-react"
import { FaGoogle, FaFacebook, FaTwitter } from "react-icons/fa"

const countries = [
  { name: "Afghanistan", code: "AF", phone: "+93" },
  { name: "Albania", code: "AL", phone: "+355" },
  { name: "Algeria", code: "DZ", phone: "+213" },
  { name: "Andorra", code: "AD", phone: "+376" },
  { name: "Angola", code: "AO", phone: "+244" },
  { name: "Antigua and Barbuda", code: "AG", phone: "+1268" },
  { name: "Argentina", code: "AR", phone: "+54" },
  { name: "Armenia", code: "AM", phone: "+374" },
  { name: "Australia", code: "AU", phone: "+61" },
  { name: "Austria", code: "AT", phone: "+43" },
  { name: "Azerbaijan", code: "AZ", phone: "+994" },
  { name: "Bahamas", code: "BS", phone: "+1242" },
  { name: "Bahrain", code: "BH", phone: "+973" },
  { name: "Bangladesh", code: "BD", phone: "+880" },
  { name: "Barbados", code: "BB", phone: "+1246" },
  { name: "Belarus", code: "BY", phone: "+375" },
  { name: "Belgium", code: "BE", phone: "+32" },
  { name: "Belize", code: "BZ", phone: "+501" },
  { name: "Benin", code: "BJ", phone: "+229" },
  { name: "Bhutan", code: "BT", phone: "+975" },
  { name: "Bolivia", code: "BO", phone: "+591" },
  { name: "Bosnia and Herzegovina", code: "BA", phone: "+387" },
  { name: "Botswana", code: "BW", phone: "+267" },
  { name: "Brazil", code: "BR", phone: "+55" },
  { name: "Brunei", code: "BN", phone: "+673" },
  { name: "Bulgaria", code: "BG", phone: "+359" },
  { name: "Burkina Faso", code: "BF", phone: "+226" },
  { name: "Burundi", code: "BI", phone: "+257" },
  { name: "Cambodia", code: "KH", phone: "+855" },
  { name: "Cameroon", code: "CM", phone: "+237" },
  { name: "Canada", code: "CA", phone: "+1" },
  { name: "Cape Verde", code: "CV", phone: "+238" },
  { name: "Central African Republic", code: "CF", phone: "+236" },
  { name: "Chad", code: "TD", phone: "+235" },
  { name: "Chile", code: "CL", phone: "+56" },
  { name: "China", code: "CN", phone: "+86" },
  { name: "Colombia", code: "CO", phone: "+57" },
  { name: "Comoros", code: "KM", phone: "+269" },
  { name: "Congo", code: "CG", phone: "+242" },
  { name: "Costa Rica", code: "CR", phone: "+506" },
  { name: "Croatia", code: "HR", phone: "+385" },
  { name: "Cuba", code: "CU", phone: "+53" },
  { name: "Cyprus", code: "CY", phone: "+357" },
  { name: "Czech Republic", code: "CZ", phone: "+420" },
  { name: "Democratic Republic of the Congo", code: "CD", phone: "+243" },
  { name: "Denmark", code: "DK", phone: "+45" },
  { name: "Djibouti", code: "DJ", phone: "+253" },
  { name: "Dominica", code: "DM", phone: "+1767" },
  { name: "Dominican Republic", code: "DO", phone: "+1809" },
  { name: "Ecuador", code: "EC", phone: "+593" },
  { name: "Egypt", code: "EG", phone: "+20" },
  { name: "El Salvador", code: "SV", phone: "+503" },
  { name: "Equatorial Guinea", code: "GQ", phone: "+240" },
  { name: "Eritrea", code: "ER", phone: "+291" },
  { name: "Estonia", code: "EE", phone: "+372" },
  { name: "Eswatini", code: "SZ", phone: "+268" },
  { name: "Ethiopia", code: "ET", phone: "+251" },
  { name: "Fiji", code: "FJ", phone: "+679" },
  { name: "Finland", code: "FI", phone: "+358" },
  { name: "France", code: "FR", phone: "+33" },
  { name: "Gabon", code: "GA", phone: "+241" },
  { name: "Gambia", code: "GM", phone: "+220" },
  { name: "Georgia", code: "GE", phone: "+995" },
  { name: "Germany", code: "DE", phone: "+49" },
  { name: "Ghana", code: "GH", phone: "+233" },
  { name: "Greece", code: "GR", phone: "+30" },
  { name: "Grenada", code: "GD", phone: "+1473" },
  { name: "Guatemala", code: "GT", phone: "+502" },
  { name: "Guinea", code: "GN", phone: "+224" },
  { name: "Guinea-Bissau", code: "GW", phone: "+245" },
  { name: "Guyana", code: "GY", phone: "+592" },
  { name: "Haiti", code: "HT", phone: "+509" },
  { name: "Honduras", code: "HN", phone: "+504" },
  { name: "Hungary", code: "HU", phone: "+36" },
  { name: "Iceland", code: "IS", phone: "+354" },
  { name: "India", code: "IN", phone: "+91" },
  { name: "Indonesia", code: "ID", phone: "+62" },
  { name: "Iran", code: "IR", phone: "+98" },
  { name: "Iraq", code: "IQ", phone: "+964" },
  { name: "Ireland", code: "IE", phone: "+353" },
  { name: "Israel", code: "IL", phone: "+972" },
  { name: "Italy", code: "IT", phone: "+39" },
  { name: "Ivory Coast", code: "CI", phone: "+225" },
  { name: "Jamaica", code: "JM", phone: "+1876" },
  { name: "Japan", code: "JP", phone: "+81" },
  { name: "Jordan", code: "JO", phone: "+962" },
  { name: "Kazakhstan", code: "KZ", phone: "+7" },
  { name: "Kenya", code: "KE", phone: "+254" },
  { name: "Kiribati", code: "KI", phone: "+686" },
  { name: "Kuwait", code: "KW", phone: "+965" },
  { name: "Kyrgyzstan", code: "KG", phone: "+996" },
  { name: "Laos", code: "LA", phone: "+856" },
  { name: "Latvia", code: "LV", phone: "+371" },
  { name: "Lebanon", code: "LB", phone: "+961" },
  { name: "Lesotho", code: "LS", phone: "+266" },
  { name: "Liberia", code: "LR", phone: "+231" },
  { name: "Libya", code: "LY", phone: "+218" },
  { name: "Liechtenstein", code: "LI", phone: "+423" },
  { name: "Lithuania", code: "LT", phone: "+370" },
  { name: "Luxembourg", code: "LU", phone: "+352" },
  { name: "Madagascar", code: "MG", phone: "+261" },
  { name: "Malawi", code: "MW", phone: "+265" },
  { name: "Malaysia", code: "MY", phone: "+60" },
  { name: "Maldives", code: "MV", phone: "+960" },
  { name: "Mali", code: "ML", phone: "+223" },
  { name: "Malta", code: "MT", phone: "+356" },
  { name: "Marshall Islands", code: "MH", phone: "+692" },
  { name: "Mauritania", code: "MR", phone: "+222" },
  { name: "Mauritius", code: "MU", phone: "+230" },
  { name: "Mexico", code: "MX", phone: "+52" },
  { name: "Micronesia", code: "FM", phone: "+691" },
  { name: "Moldova", code: "MD", phone: "+373" },
  { name: "Monaco", code: "MC", phone: "+377" },
  { name: "Mongolia", code: "MN", phone: "+976" },
  { name: "Montenegro", code: "ME", phone: "+382" },
  { name: "Morocco", code: "MA", phone: "+212" },
  { name: "Mozambique", code: "MZ", phone: "+258" },
  { name: "Myanmar", code: "MM", phone: "+95" },
  { name: "Namibia", code: "NA", phone: "+264" },
  { name: "Nauru", code: "NR", phone: "+674" },
  { name: "Nepal", code: "NP", phone: "+977" },
  { name: "Netherlands", code: "NL", phone: "+31" },
  { name: "New Zealand", code: "NZ", phone: "+64" },
  { name: "Nicaragua", code: "NI", phone: "+505" },
  { name: "Niger", code: "NE", phone: "+227" },
  { name: "Nigeria", code: "NG", phone: "+234" },
  { name: "North Korea", code: "KP", phone: "+850" },
  { name: "North Macedonia", code: "MK", phone: "+389" },
  { name: "Norway", code: "NO", phone: "+47" },
  { name: "Oman", code: "OM", phone: "+968" },
  { name: "Pakistan", code: "PK", phone: "+92" },
  { name: "Palau", code: "PW", phone: "+680" },
  { name: "Palestine", code: "PS", phone: "+970" },
  { name: "Panama", code: "PA", phone: "+507" },
  { name: "Papua New Guinea", code: "PG", phone: "+675" },
  { name: "Paraguay", code: "PY", phone: "+595" },
  { name: "Peru", code: "PE", phone: "+51" },
  { name: "Philippines", code: "PH", phone: "+63" },
  { name: "Poland", code: "PL", phone: "+48" },
  { name: "Portugal", code: "PT", phone: "+351" },
  { name: "Qatar", code: "QA", phone: "+974" },
  { name: "Romania", code: "RO", phone: "+40" },
  { name: "Russia", code: "RU", phone: "+7" },
  { name: "Rwanda", code: "RW", phone: "+250" },
  { name: "Saint Kitts and Nevis", code: "KN", phone: "+1869" },
  { name: "Saint Lucia", code: "LC", phone: "+1758" },
  { name: "Saint Vincent and the Grenadines", code: "VC", phone: "+1784" },
  { name: "Samoa", code: "WS", phone: "+685" },
  { name: "San Marino", code: "SM", phone: "+378" },
  { name: "Sao Tome and Principe", code: "ST", phone: "+239" },
  { name: "Saudi Arabia", code: "SA", phone: "+966" },
  { name: "Senegal", code: "SN", phone: "+221" },
  { name: "Serbia", code: "RS", phone: "+381" },
  { name: "Seychelles", code: "SC", phone: "+248" },
  { name: "Sierra Leone", code: "SL", phone: "+232" },
  { name: "Singapore", code: "SG", phone: "+65" },
  { name: "Slovakia", code: "SK", phone: "+421" },
  { name: "Slovenia", code: "SI", phone: "+386" },
  { name: "Solomon Islands", code: "SB", phone: "+677" },
  { name: "Somalia", code: "SO", phone: "+252" },
  { name: "South Africa", code: "ZA", phone: "+27" },
  { name: "South Korea", code: "KR", phone: "+82" },
  { name: "South Sudan", code: "SS", phone: "+211" },
  { name: "Spain", code: "ES", phone: "+34" },
  { name: "Sri Lanka", code: "LK", phone: "+94" },
  { name: "Sudan", code: "SD", phone: "+249" },
  { name: "Suriname", code: "SR", phone: "+597" },
  { name: "Sweden", code: "SE", phone: "+46" },
  { name: "Switzerland", code: "CH", phone: "+41" },
  { name: "Syria", code: "SY", phone: "+963" },
  { name: "Taiwan", code: "TW", phone: "+886" },
  { name: "Tajikistan", code: "TJ", phone: "+992" },
  { name: "Tanzania", code: "TZ", phone: "+255" },
  { name: "Thailand", code: "TH", phone: "+66" },
  { name: "Timor-Leste", code: "TL", phone: "+670" },
  { name: "Togo", code: "TG", phone: "+228" },
  { name: "Tonga", code: "TO", phone: "+676" },
  { name: "Trinidad and Tobago", code: "TT", phone: "+1868" },
  { name: "Tunisia", code: "TN", phone: "+216" },
  { name: "Turkey", code: "TR", phone: "+90" },
  { name: "Turkmenistan", code: "TM", phone: "+993" },
  { name: "Tuvalu", code: "TV", phone: "+688" },
  { name: "Uganda", code: "UG", phone: "+256" },
  { name: "Ukraine", code: "UA", phone: "+380" },
  { name: "United Arab Emirates", code: "AE", phone: "+971" },
  { name: "United Kingdom", code: "GB", phone: "+44" },
  { name: "United States", code: "US", phone: "+1" },
  { name: "Uruguay", code: "UY", phone: "+598" },
  { name: "Uzbekistan", code: "UZ", phone: "+998" },
  { name: "Vanuatu", code: "VU", phone: "+678" },
  { name: "Vatican City", code: "VA", phone: "+39" },
  { name: "Venezuela", code: "VE", phone: "+58" },
  { name: "Vietnam", code: "VN", phone: "+84" },
  { name: "Yemen", code: "YE", phone: "+967" },
  { name: "Zambia", code: "ZM", phone: "+260" },
  { name: "Zimbabwe", code: "ZW", phone: "+263" },
]

export function RegisterForm() {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
    username: "",
    country: "",
    phoneNumber: "",
    phoneCountryCode: "+1", // Set default phone code
  })
  const [selectedCountryCode, setSelectedCountryCode] = useState<string>("")
  const [selectedPhoneCode, setSelectedPhoneCode] = useState<string>("+1")
  const [isDetectingLocation, setIsDetectingLocation] = useState(true)
  const [error, setError] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [referralCode, setReferralCode] = useState("")
  const [socialLoading, setSocialLoading] = useState<string | null>(null)
  const [showSocialCompletion, setShowSocialCompletion] = useState(false)
  const [socialUserData, setSocialUserData] = useState<any>(null)
  const { signUp, signInWithOAuth, isLoading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const refCode = searchParams.get("ref")
    if (refCode) {
      setReferralCode(refCode)
    }
  }, [searchParams])

  useEffect(() => {
    const detectUserLocation = async () => {
      try {
        console.log("[v0] Starting IP geolocation detection...")
        let data = null

        // Try ipapi.co first
        try {
          const response = await fetch("https://ipapi.co/json/", {
            method: "GET",
            headers: {
              Accept: "application/json",
            },
          })
          if (response.ok) {
            data = await response.json()
            console.log("[v0] ipapi.co response:", data)
          }
        } catch (error) {
          console.log("[v0] ipapi.co failed, trying fallback...")
        }

        // Fallback to ip-api.com if first fails
        if (!data || !data.country_code) {
          try {
            const response = await fetch("http://ip-api.com/json/", {
              method: "GET",
              headers: {
                Accept: "application/json",
              },
            })
            if (response.ok) {
              const fallbackData = await response.json()
              console.log("[v0] ip-api.com response:", fallbackData)
              if (fallbackData.countryCode) {
                data = {
                  country_code: fallbackData.countryCode,
                  country_name: fallbackData.country,
                }
              }
            }
          } catch (error) {
            console.log("[v0] ip-api.com also failed...")
          }
        }

        // If we have country data, use it
        if (data && data.country_code) {
          const detectedCountry = countries.find((country) => country.code === data.country_code.toUpperCase())

          if (detectedCountry) {
            console.log("[v0] Auto-selecting country:", detectedCountry.name)
            setFormData((prev) => ({
              ...prev,
              country: detectedCountry.name,
              phoneCountryCode: detectedCountry.phone,
            }))
            setSelectedCountryCode(detectedCountry.code)
            setSelectedPhoneCode(detectedCountry.phone)
          } else {
            console.log("[v0] Country not found in list:", data.country_code)
            const defaultCountry = countries.find((c) => c.code === "US")
            if (defaultCountry) {
              setFormData((prev) => ({
                ...prev,
                country: defaultCountry.name,
                phoneCountryCode: defaultCountry.phone,
              }))
              setSelectedCountryCode(defaultCountry.code)
              setSelectedPhoneCode(defaultCountry.phone)
            }
          }
        } else {
          console.log("[v0] No country data available, using default")
          const defaultCountry = countries.find((c) => c.code === "US")
          if (defaultCountry) {
            setFormData((prev) => ({
              ...prev,
              country: defaultCountry.name,
              phoneCountryCode: defaultCountry.phone,
            }))
            setSelectedCountryCode(defaultCountry.code)
            setSelectedPhoneCode(defaultCountry.phone)
          }
        }
      } catch (error) {
        console.error("[v0] IP geolocation failed:", error)
        const defaultCountry = countries.find((c) => c.code === "US")
        if (defaultCountry) {
          setFormData((prev) => ({
            ...prev,
            country: defaultCountry.name,
            phoneCountryCode: defaultCountry.phone,
          }))
          setSelectedCountryCode(defaultCountry.code)
          setSelectedPhoneCode(defaultCountry.phone)
        }
      } finally {
        setIsDetectingLocation(false)
      }
    }

    detectUserLocation()
  }, [])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const handleCountryChange = useCallback((countryCode: string) => {
    const country = countries.find((c) => c.code === countryCode)
    if (country) {
      setSelectedCountryCode(countryCode)
      setFormData((prev) => ({
        ...prev,
        country: country.name,
        phoneCountryCode: country.phone,
      }))
      setSelectedPhoneCode(country.phone)
    }
  }, [])

  const handlePhoneCodeChange = useCallback((phoneCode: string) => {
    setSelectedPhoneCode(phoneCode)
    setFormData((prev) => ({
      ...prev,
      phoneCountryCode: phoneCode,
    }))
  }, [])

  const handleSocialAuth = async (provider: "google" | "facebook" | "twitter") => {
    setSocialLoading(provider)
    setError("")

    try {
      console.log(`[v0] Initiating ${provider} registration...`)
      await signInWithOAuth(provider)
      // OAuth flow will redirect to provider, so no need to handle success here
    } catch (err) {
      console.error(`[v0] OAuth error for ${provider}:`, err)
      setError(err instanceof Error ? err.message : `Failed to authenticate with ${provider}`)
      setSocialLoading(null)
    }
  }

  const countryByCode = useMemo(() => {
    return countries.reduce(
      (acc, country) => {
        acc[country.code] = country
        return acc
      },
      {} as Record<string, (typeof countries)[0]>,
    )
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (showSocialCompletion) {
      const requiredFields = ["username", "country", "phoneNumber", "phoneCountryCode"]
      const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])

      if (missingFields.length > 0) {
        setError("Please fill in all fields")
        return
      }

      if (formData.username.length < 3) {
        setError("Username must be at least 3 characters long")
        return
      }

      if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        setError("Username can only contain letters, numbers, and underscores")
        return
      }

      if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phoneNumber)) {
        setError("Please enter a valid phone number")
        return
      }

      const socialSignUpData = {
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        country: formData.country,
        phoneNumber: formData.phoneNumber,
        phoneCountryCode: formData.phoneCountryCode,
        referralCode: referralCode || undefined,
        socialProvider: socialUserData.provider,
        socialId: `${socialUserData.provider}_${Date.now()}`, // Mock social ID
      }

      try {
        await signUp(socialSignUpData)
        router.push("/dashboard")
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create account. Please try again.")
      }
      return
    }

    const requiredFields = [
      "email",
      "password",
      "firstName",
      "lastName",
      "username",
      "country",
      "phoneNumber",
      "phoneCountryCode",
    ]
    const missingFields = requiredFields.filter((field) => !formData[field as keyof typeof formData])

    if (missingFields.length > 0) {
      setError("Please fill in all fields")
      return
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match")
      return
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long")
      return
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(formData.password)) {
      setError("Password must contain at least one uppercase letter, one lowercase letter, and one number")
      return
    }

    if (formData.username.length < 3) {
      setError("Username must be at least 3 characters long")
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      setError("Username can only contain letters, numbers, and underscores")
      return
    }

    if (!/^\+?[\d\s\-()]{10,}$/.test(formData.phoneNumber)) {
      setError("Please enter a valid phone number")
      return
    }

    try {
      const signUpData = {
        ...formData,
        referralCode: referralCode || undefined,
      }

      await signUp(signUpData)
      router.push("/dashboard")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account. Please try again.")
    }
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold text-center">
          {showSocialCompletion ? "Complete your profile" : "Create account"}
        </CardTitle>
        <CardDescription className="text-center">
          {showSocialCompletion
            ? `Complete your registration with ${socialUserData?.provider}`
            : "Join WorkHub and start your journey"}
          {referralCode && (
            <div className="mt-2 p-2 bg-green-50 rounded-lg border border-green-200">
              <div className="flex items-center justify-center space-x-2 text-green-700">
                <Gift className="w-4 h-4" />
                <span className="text-sm font-medium">You're invited! Referral code: {referralCode}</span>
              </div>
            </div>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {!showSocialCompletion && (
          <>
            <div className="space-y-3 mb-6">
              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => handleSocialAuth("google")}
                disabled={isLoading || socialLoading !== null}
              >
                {socialLoading === "google" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaGoogle className="mr-2 h-4 w-4 text-red-500" />
                )}
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => handleSocialAuth("facebook")}
                disabled={isLoading || socialLoading !== null}
              >
                {socialLoading === "facebook" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaFacebook className="mr-2 h-4 w-4 text-blue-600" />
                )}
                Continue with Facebook
              </Button>

              <Button
                type="button"
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => handleSocialAuth("twitter")}
                disabled={isLoading || socialLoading !== null}
              >
                {socialLoading === "twitter" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <FaTwitter className="mr-2 h-4 w-4 text-blue-400" />
                )}
                Continue with Twitter
              </Button>
            </div>

            <div className="relative mb-6">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">Or continue with email</span>
              </div>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {showSocialCompletion && socialUserData && (
            <Alert>
              <AlertDescription>
                Connected with {socialUserData.provider}. Please complete the missing information below.
              </AlertDescription>
            </Alert>
          )}

          {!showSocialCompletion && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="firstName"
                    name="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="lastName"
                    name="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="pl-10"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="username"
                name="username"
                placeholder="johndoe"
                value={formData.username}
                onChange={handleChange}
                className="pl-10"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              At least 3 characters, letters, numbers, and underscores only
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="country">Country of Residence</Label>
            <Select
              onValueChange={handleCountryChange}
              disabled={isLoading || isDetectingLocation}
              value={selectedCountryCode}
            >
              <SelectTrigger className="w-full">
                <div className="flex items-center">
                  <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                  <SelectValue
                    placeholder={isDetectingLocation ? "Detecting your location..." : "Select your country"}
                  />
                </div>
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    {country.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isDetectingLocation && (
              <p className="text-xs text-muted-foreground flex items-center">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                Detecting your location...
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNumber">Phone Number</Label>
            <div className="flex">
              <Select
                onValueChange={handlePhoneCodeChange}
                disabled={isLoading || isDetectingLocation}
                value={selectedPhoneCode}
              >
                <SelectTrigger className="w-[120px] rounded-r-none border-r-0">
                  <div className="flex items-center">
                    <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{selectedPhoneCode}</span>
                    <ChevronDown className="ml-1 h-3 w-3 text-muted-foreground" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {countries.map((country) => (
                    <SelectItem key={`phone-${country.code}`} value={country.phone}>
                      <div className="flex items-center justify-between w-full">
                        <span className="font-mono">{country.phone}</span>
                        <span className="text-muted-foreground ml-2 text-xs">{country.name}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                placeholder="123-456-7890"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="flex-1 rounded-l-none"
                disabled={isLoading}
              />
            </div>
            <p className="text-xs text-muted-foreground">Enter your phone number without the country code</p>
          </div>

          {!showSocialCompletion && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10"
                  disabled={isLoading}
                />
              </div>
            </div>
          )}

          {!showSocialCompletion && (
            <>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  At least 8 characters with uppercase, lowercase, and number
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="pl-10 pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {showSocialCompletion ? "Completing registration..." : "Creating account..."}
              </>
            ) : showSocialCompletion ? (
              "Complete Registration"
            ) : (
              "Create Account"
            )}
          </Button>
        </form>

        {!showSocialCompletion && (
          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">Already have an account? </span>
            <Link href="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
