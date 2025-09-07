export interface JobApplication {
  id: string
  jobId: string
  workerId: string
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled"
  coverLetter?: string
  proposedPrice?: number
  estimatedDuration?: string
  createdAt: string
  updatedAt: string
  acceptedAt?: string
  completedAt?: string
  cancelledAt?: string
  rejectedAt?: string
  rejectionReason?: string
  // Relations
  job?: any
  worker?: any
}

function getApplicationsFromStorage(): JobApplication[] {
  if (typeof window === "undefined") return []
  try {
    const stored = localStorage.getItem("marketplace-applications")
    return stored ? JSON.parse(stored) : []
  } catch (error) {
    console.error("Error reading applications from localStorage:", error)
    return []
  }
}

function saveApplicationsToStorage(applications: JobApplication[]): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem("marketplace-applications", JSON.stringify(applications))
  } catch (error) {
    console.error("Error saving applications to localStorage:", error)
  }
}

function getJobById(jobId: string): any {
  if (typeof window === "undefined") return null
  try {
    const jobs = JSON.parse(localStorage.getItem("jobs_database") || "[]")
    return jobs.find((job: any) => job.id === jobId)
  } catch (error) {
    console.error("Error fetching job:", error)
    return null
  }
}

function getUserById(userId: string): any {
  if (typeof window === "undefined") return null
  try {
    const users = JSON.parse(localStorage.getItem("users_database") || "[]")
    return users.find((user: any) => user.id === userId)
  } catch (error) {
    console.error("Error fetching user:", error)
    return null
  }
}

export async function getApplicationsByUser(userId: string): Promise<JobApplication[]> {
  try {
    const applications = getApplicationsFromStorage()
    const userApplications = applications
      .filter((app) => app.workerId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Add job and worker relations
    return userApplications.map((app) => ({
      ...app,
      job: getJobById(app.jobId),
      worker: getUserById(app.workerId),
    }))
  } catch (error) {
    console.error("Error in getApplicationsByUser:", error)
    return []
  }
}

export async function getApplicationById(applicationId: string): Promise<JobApplication | null> {
  try {
    const applications = getApplicationsFromStorage()
    const application = applications.find((app) => app.id === applicationId)

    if (!application) return null

    return {
      ...application,
      job: getJobById(application.jobId),
      worker: getUserById(application.workerId),
    }
  } catch (error) {
    console.error("Error in getApplicationById:", error)
    return null
  }
}

export async function createJobApplication(application: {
  jobId: string
  workerId: string
  coverLetter?: string
  proposedPrice?: number
  estimatedDuration?: string
}): Promise<JobApplication | null> {
  try {
    const applications = getApplicationsFromStorage()
    const now = new Date().toISOString()

    const newApplication: JobApplication = {
      id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      jobId: application.jobId,
      workerId: application.workerId,
      status: "pending",
      coverLetter: application.coverLetter,
      proposedPrice: application.proposedPrice,
      estimatedDuration: application.estimatedDuration,
      createdAt: now,
      updatedAt: now,
    }

    applications.push(newApplication)
    saveApplicationsToStorage(applications)

    return newApplication
  } catch (error) {
    console.error("Error in createJobApplication:", error)
    return null
  }
}

export async function updateApplicationStatus(
  applicationId: string,
  status: JobApplication["status"],
  additionalData?: {
    rejectionReason?: string
  },
): Promise<boolean> {
  try {
    const applications = getApplicationsFromStorage()
    const applicationIndex = applications.findIndex((app) => app.id === applicationId)

    if (applicationIndex === -1) return false

    const now = new Date().toISOString()
    applications[applicationIndex].status = status
    applications[applicationIndex].updatedAt = now

    // Set timestamp fields based on status
    switch (status) {
      case "accepted":
        applications[applicationIndex].acceptedAt = now
        break
      case "rejected":
        applications[applicationIndex].rejectedAt = now
        if (additionalData?.rejectionReason) {
          applications[applicationIndex].rejectionReason = additionalData.rejectionReason
        }
        break
      case "completed":
        applications[applicationIndex].completedAt = now
        break
      case "cancelled":
        applications[applicationIndex].cancelledAt = now
        break
    }

    saveApplicationsToStorage(applications)
    return true
  } catch (error) {
    console.error("Error in updateApplicationStatus:", error)
    return false
  }
}

export async function getApplicationsByJob(jobId: string): Promise<JobApplication[]> {
  try {
    const applications = getApplicationsFromStorage()
    const jobApplications = applications
      .filter((app) => app.jobId === jobId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

    // Add worker relations
    return jobApplications.map((app) => ({
      ...app,
      worker: getUserById(app.workerId),
    }))
  } catch (error) {
    console.error("Error in getApplicationsByJob:", error)
    return []
  }
}

export async function deleteApplication(applicationId: string): Promise<boolean> {
  try {
    const applications = getApplicationsFromStorage()
    const filteredApplications = applications.filter((app) => app.id !== applicationId)

    if (filteredApplications.length === applications.length) {
      return false // Application not found
    }

    saveApplicationsToStorage(filteredApplications)
    return true
  } catch (error) {
    console.error("Error in deleteApplication:", error)
    return false
  }
}
