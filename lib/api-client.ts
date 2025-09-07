const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api"

class ApiClient {
  private baseURL: string

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      ...options,
    }

    // Add auth token if available
    const token = localStorage.getItem("auth_token")
    if (token) {
      config.headers = {
        ...config.headers,
        Authorization: `Bearer ${token}`,
      }
    }

    const response = await fetch(url, config)

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Network error" }))
      throw new Error(error.message || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    })
  }

  async register(userData: any) {
    return this.request("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    })
  }

  async logout() {
    return this.request("/auth/logout", { method: "POST" })
  }

  // Jobs methods
  async getJobs(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`/jobs${query}`)
  }

  async getJob(id: string) {
    return this.request(`/jobs/${id}`)
  }

  async createJob(jobData: any) {
    return this.request("/jobs", {
      method: "POST",
      body: JSON.stringify(jobData),
    })
  }

  // Favorites methods
  async getFavorites() {
    return this.request("/favorites")
  }

  async addFavorite(jobId: string) {
    return this.request("/favorites", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    })
  }

  async removeFavorite(jobId: string) {
    return this.request("/favorites", {
      method: "DELETE",
      body: JSON.stringify({ jobId }),
    })
  }

  // Reservations methods
  async getReservations() {
    return this.request("/reservations")
  }

  async createReservation(jobId: string) {
    return this.request("/reservations", {
      method: "POST",
      body: JSON.stringify({ jobId }),
    })
  }

  // Admin methods
  async getCommissionSettings() {
    return this.request("/admin/commission")
  }

  async updateCommissionSettings(settings: any) {
    return this.request("/admin/commission", {
      method: "PUT",
      body: JSON.stringify(settings),
    })
  }

  // Support methods
  async createSupportTicket(ticketData: any) {
    return this.request("/support/tickets", {
      method: "POST",
      body: JSON.stringify(ticketData),
    })
  }

  async getSupportTickets(params?: any) {
    const query = params ? `?${new URLSearchParams(params)}` : ""
    return this.request(`/support/tickets${query}`)
  }

  // Referrals methods
  async getReferrals() {
    return this.request("/referrals")
  }

  async generateReferralCode() {
    return this.request("/referrals/generate-code", { method: "POST" })
  }

  // Money transfer methods
  async createMoneyTransfer(transferData: any) {
    return this.request("/chat/money-transfer", {
      method: "POST",
      body: JSON.stringify(transferData),
    })
  }
}

export const apiClient = new ApiClient()
export default apiClient
