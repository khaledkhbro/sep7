"use client"

import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, Plus, X, Globe, Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import { useState } from "react"
import { useToast } from "@/hooks/use-toast"
import { LazyAvatar } from "@/components/ui/lazy-avatar"

const SellerProgressDashboard = dynamic(
  () =>
    import("@/components/seller/seller-progress-dashboard").then((mod) => ({ default: mod.SellerProgressDashboard })),
  {
    loading: () => (
      <Card>
        <CardHeader>
          <div className="h-6 bg-muted animate-pulse rounded" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-4 bg-muted animate-pulse rounded" />
            <div className="h-20 bg-muted animate-pulse rounded" />
            <div className="h-4 bg-muted animate-pulse rounded" />
          </div>
        </CardContent>
      </Card>
    ),
    ssr: false,
  },
)

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

const languages = [
  { name: "English", code: "en", native: "English" },
  { name: "Spanish", code: "es", native: "Español" },
  { name: "French", code: "fr", native: "Français" },
  { name: "German", code: "de", native: "Deutsch" },
  { name: "Italian", code: "it", native: "Italiano" },
  { name: "Portuguese", code: "pt", native: "Português" },
  { name: "Russian", code: "ru", native: "Русский" },
  { name: "Chinese (Simplified)", code: "zh-cn", native: "简体中文" },
  { name: "Chinese (Traditional)", code: "zh-tw", native: "繁體中文" },
  { name: "Japanese", code: "ja", native: "日本語" },
  { name: "Korean", code: "ko", native: "한국어" },
  { name: "Arabic", code: "ar", native: "العربية" },
  { name: "Hindi", code: "hi", native: "हिन्दी" },
  { name: "Bengali", code: "bn", native: "বাংলা" },
  { name: "Urdu", code: "ur", native: "اردو" },
  { name: "Turkish", code: "tr", native: "Türkçe" },
  { name: "Dutch", code: "nl", native: "Nederlands" },
  { name: "Swedish", code: "sv", native: "Svenska" },
  { name: "Norwegian", code: "no", native: "Norsk" },
  { name: "Danish", code: "da", native: "Dansk" },
  { name: "Finnish", code: "fi", native: "Suomi" },
  { name: "Polish", code: "pl", native: "Polski" },
  { name: "Czech", code: "cs", native: "Čeština" },
  { name: "Hungarian", code: "hu", native: "Magyar" },
  { name: "Romanian", code: "ro", native: "Română" },
  { name: "Bulgarian", code: "bg", native: "Български" },
  { name: "Croatian", code: "hr", native: "Hrvatski" },
  { name: "Serbian", code: "sr", native: "Српски" },
  { name: "Ukrainian", code: "uk", native: "Українська" },
  { name: "Greek", code: "el", native: "Ελληνικά" },
  { name: "Hebrew", code: "he", native: "עברית" },
  { name: "Thai", code: "th", native: "ไทย" },
  { name: "Vietnamese", code: "vi", native: "Tiếng Việt" },
  { name: "Indonesian", code: "id", native: "Bahasa Indonesia" },
  { name: "Malay", code: "ms", native: "Bahasa Melayu" },
  { name: "Filipino", code: "fil", native: "Filipino" },
  { name: "Swahili", code: "sw", native: "Kiswahili" },
  { name: "Afrikaans", code: "af", native: "Afrikaans" },
  { name: "Amharic", code: "am", native: "አማርኛ" },
  { name: "Azerbaijani", code: "az", native: "Azərbaycan" },
  { name: "Belarusian", code: "be", native: "Беларуская" },
  { name: "Bosnian", code: "bs", native: "Bosanski" },
  { name: "Catalan", code: "ca", native: "Català" },
  { name: "Estonian", code: "et", native: "Eesti" },
  { name: "Persian", code: "fa", native: "فارسی" },
  { name: "Gujarati", code: "gu", native: "ગુજરાતી" },
  { name: "Icelandic", code: "is", native: "Íslenska" },
  { name: "Georgian", code: "ka", native: "ქართული" },
  { name: "Kazakh", code: "kk", native: "Қазақша" },
  { name: "Khmer", code: "km", native: "ខ្មែរ" },
  { name: "Kannada", code: "kn", native: "ಕನ್ನಡ" },
  { name: "Lao", code: "lo", native: "ລາວ" },
  { name: "Lithuanian", code: "lt", native: "Lietuvių" },
  { name: "Latvian", code: "lv", native: "Latviešu" },
  { name: "Macedonian", code: "mk", native: "Македонски" },
  { name: "Malayalam", code: "ml", native: "മലയാളം" },
  { name: "Mongolian", code: "mn", native: "Монгол" },
  { name: "Marathi", code: "mr", native: "मराठी" },
  { name: "Burmese", code: "my", native: "မြန်မာ" },
  { name: "Nepali", code: "ne", native: "नेपाली" },
  { name: "Punjabi", code: "pa", native: "ਪੰਜਾਬੀ" },
  { name: "Sinhala", code: "si", native: "සිංහල" },
  { name: "Slovak", code: "sk", native: "Slovenčina" },
  { name: "Slovenian", code: "sl", native: "Slovenščina" },
  { name: "Albanian", code: "sq", native: "Shqip" },
  { name: "Tamil", code: "ta", native: "தமிழ்" },
  { name: "Telugu", code: "te", native: "తెలుగు" },
  { name: "Uzbek", code: "uz", native: "O'zbek" },
  { name: "Zulu", code: "zu", native: "isiZulu" },
]

export default function ProfilePage() {
  const sellerId = "user-123"
  const [selectedCountry, setSelectedCountry] = useState("US")
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>(["en", "es"])
  const [languageInput, setLanguageInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    phone: "+1 (555) 123-4567",
    bio: "Experienced web developer with 5+ years in full-stack development.",
  })
  const { toast } = useToast()

  const addLanguage = (languageCode: string) => {
    if (!selectedLanguages.includes(languageCode)) {
      setSelectedLanguages([...selectedLanguages, languageCode])
    }
    setLanguageInput("")
  }

  const removeLanguage = (languageCode: string) => {
    setSelectedLanguages(selectedLanguages.filter((code) => code !== languageCode))
  }

  const getLanguageName = (code: string) => {
    const language = languages.find((lang) => lang.code === code)
    return language ? language.name : code
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  const handleSaveChanges = async () => {
    setIsLoading(true)
    console.log("[v0] Saving profile changes...")

    try {
      const profileData = {
        ...formData,
        country: selectedCountry,
        languages: selectedLanguages,
        sellerId,
      }

      console.log("[v0] Profile data to save:", profileData)

      const response = await fetch("/api/profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(profileData),
      })

      if (!response.ok) {
        throw new Error("Failed to save profile")
      }

      const result = await response.json()
      console.log("[v0] Profile saved successfully:", result)

      toast({
        title: "Profile Updated",
        description: "Your profile has been saved successfully.",
      })
    } catch (error) {
      console.error("[v0] Error saving profile:", error)
      toast({
        title: "Error",
        description: "Failed to save profile. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      <DashboardHeader title="Profile Settings" description="Manage your profile information and preferences." />

      <div className="flex-1 overflow-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Seller Level Progress section */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900">Seller Level & Progress</h3>
            <SellerProgressDashboard sellerId={sellerId} />
          </div>

          {/* Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Photo</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center space-x-6">
              <LazyAvatar
                src="/placeholder.svg?height=96&width=96"
                alt="Profile"
                fallback="JD"
                className="h-24 w-24"
                priority={true}
              />
              <div>
                <Button variant="outline" className="mb-2 bg-transparent">
                  <Camera className="mr-2 h-4 w-4" />
                  Change Photo
                </Button>
                <p className="text-sm text-gray-600">JPG, GIF or PNG. Max size 2MB.</p>
              </div>
            </CardContent>
          </Card>

          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange("firstName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange("lastName", e.target.value)}
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" value={formData.phone} onChange={(e) => handleInputChange("phone", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="country">Country</Label>
                <Select onValueChange={setSelectedCountry} value={selectedCountry}>
                  <SelectTrigger className="w-full">
                    <div className="flex items-center">
                      <Globe className="mr-2 h-4 w-4 text-muted-foreground" />
                      <SelectValue placeholder="Select your country" />
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
              </div>
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => handleInputChange("bio", e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Languages */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Languages
              </CardTitle>
              <p className="text-sm text-gray-600">Select the languages you can communicate in for your services</p>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                {selectedLanguages.map((languageCode) => (
                  <Badge key={languageCode} variant="secondary" className="flex items-center gap-1">
                    {getLanguageName(languageCode)}
                    <X
                      className="ml-1 h-3 w-3 cursor-pointer hover:text-red-500"
                      onClick={() => removeLanguage(languageCode)}
                    />
                  </Badge>
                ))}
                {selectedLanguages.length === 0 && <p className="text-sm text-gray-500">No languages selected</p>}
              </div>
              <div className="flex space-x-2">
                <Select onValueChange={addLanguage} value={languageInput}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Add a language..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {languages
                      .filter((lang) => !selectedLanguages.includes(lang.code))
                      .map((language) => (
                        <SelectItem key={language.code} value={language.code}>
                          <div className="flex items-center justify-between w-full">
                            <span>{language.name}</span>
                            <span className="text-sm text-gray-500 ml-2">{language.native}</span>
                          </div>
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Adding multiple languages helps buyers find you more easily and increases your service visibility
              </p>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-4">
                <Badge variant="secondary">React</Badge>
                <Badge variant="secondary">Node.js</Badge>
                <Badge variant="secondary">TypeScript</Badge>
                <Badge variant="secondary">
                  Python
                  <X className="ml-1 h-3 w-3 cursor-pointer" />
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Input placeholder="Add a skill..." className="flex-1" />
                <Button>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Save Changes */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" disabled={isLoading}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges} disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </div>
        </div>
      </div>
    </>
  )
}
