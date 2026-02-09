export interface FileAttachment {
  name: string
  type: string
  data: string // base64
}

export interface Application {
  id: string
  agencyName: string
  managerName: string
  employeeName: string
  storeName: string
  storeAddress: string
  bankName: string
  accountNumber: string
  productPhotos: FileAttachment[]
  storeSignboard: FileAttachment[]
  transactionDocs: FileAttachment[]
  status: "pending" | "approved" | "rejected"
  createdAt: string
  incentiveAmount: number
}

// In-memory store
const applications: Application[] = []

export function getAllApplications(): Application[] {
  return [...applications].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  )
}

export function getApplicationById(id: string): Application | undefined {
  return applications.find((app) => app.id === id)
}

export function addApplication(
  app: Omit<Application, "id" | "status" | "createdAt" | "incentiveAmount">
): Application {
  const newApp: Application = {
    ...app,
    id: crypto.randomUUID(),
    status: "pending",
    createdAt: new Date().toISOString(),
    incentiveAmount: 7000,
  }
  applications.push(newApp)
  return newApp
}

export function updateApplicationStatus(
  id: string,
  status: "approved" | "rejected"
): Application | null {
  const app = applications.find((a) => a.id === id)
  if (!app) return null
  app.status = status
  return app
}

export function deleteApplication(id: string): boolean {
  const index = applications.findIndex((a) => a.id === id)
  if (index === -1) return false
  applications.splice(index, 1)
  return true
}

export interface AgencySummary {
  agencyName: string
  bankName: string
  accountNumber: string
  participationCount: number
  totalAmount: number
}

export function getAgencySummaries(): AgencySummary[] {
  const approvedApps = applications.filter((a) => a.status === "approved")
  const map = new Map<string, AgencySummary>()

  for (const app of approvedApps) {
    const key = app.agencyName
    if (!map.has(key)) {
      map.set(key, {
        agencyName: app.agencyName,
        bankName: app.bankName,
        accountNumber: app.accountNumber,
        participationCount: 0,
        totalAmount: 0,
      })
    }
    const summary = map.get(key)!
    summary.participationCount += 1
    summary.totalAmount += app.incentiveAmount
    // Update bank info to latest
    summary.bankName = app.bankName
    summary.accountNumber = app.accountNumber
  }

  return Array.from(map.values())
}

/** Get unique store names and addresses from applications */
export function getStores(): Array<{ name: string; address: string }> {
  const storeMap = new Map<string, string>()
  for (const app of applications) {
    if (app.storeName && app.storeAddress) {
      storeMap.set(app.storeName, app.storeAddress)
    }
  }
  return Array.from(storeMap.entries())
    .map(([name, address]) => ({ name, address }))
    .sort((a, b) => a.name.localeCompare(b.name, "ko"))
}

export function getStats() {
  const total = applications.length
  const pending = applications.filter((a) => a.status === "pending").length
  const approved = applications.filter((a) => a.status === "approved").length
  const rejected = applications.filter((a) => a.status === "rejected").length

  // Agency participation counts (all statuses except rejected)
  const agencyMap = new Map<string, number>()
  for (const app of applications.filter((a) => a.status !== "rejected")) {
    const count = agencyMap.get(app.agencyName) || 0
    agencyMap.set(app.agencyName, count + 1)
  }

  // Total incentive for approved
  const totalIncentive = applications
    .filter((a) => a.status === "approved")
    .reduce((sum, a) => sum + a.incentiveAmount, 0)

  return {
    total,
    pending,
    approved,
    rejected,
    agencyParticipation: Object.fromEntries(agencyMap),
    totalIncentive,
  }
}
