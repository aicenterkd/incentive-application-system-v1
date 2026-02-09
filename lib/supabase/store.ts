import { supabaseAdmin } from './client'
import { deleteFilesByApplicationId } from './storage'
import type { ApplicationRow, FileAttachmentRow } from './types'
import * as memoryStore from '@/lib/store'

// Check if Supabase is configured (skip fetch/upload when not set)
const isSupabaseConfigured = () => !!process.env.NEXT_PUBLIC_SUPABASE_URL

// Keep existing interfaces for backward compatibility
export interface FileAttachment {
  name: string
  type: string
  data: string // Storage URL (already uploaded from client)
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

export interface AgencySummary {
  agencyName: string
  bankName: string
  accountNumber: string
  participationCount: number
  totalAmount: number
}

// Helper: Convert DB row to Application interface
function rowToApplication(
  row: ApplicationRow,
  files: FileAttachmentRow[]
): Application {
  return {
    id: row.id,
    agencyName: row.agency_name,
    managerName: row.manager_name,
    employeeName: row.employee_name,
    storeName: row.store_name,
    storeAddress: row.store_address,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    status: row.status,
    incentiveAmount: row.incentive_amount,
    createdAt: row.created_at,
    productPhotos: files
      .filter(f => f.file_category === 'product_photos')
      .map(f => ({ name: f.file_name, type: f.file_type, data: f.storage_url })),
    storeSignboard: files
      .filter(f => f.file_category === 'store_signboard')
      .map(f => ({ name: f.file_name, type: f.file_type, data: f.storage_url })),
    transactionDocs: files
      .filter(f => f.file_category === 'transaction_docs')
      .map(f => ({ name: f.file_name, type: f.file_type, data: f.storage_url }))
  }
}

/**
 * Get all applications (without file data for performance)
 */
export async function getAllApplications(): Promise<Application[]> {
  const { data: apps, error } = await supabaseAdmin
    .from('applications')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new Error(`Failed to fetch applications: ${error.message}`)
  if (!apps) return []

  // Return without file URLs (only metadata)
  return apps.map(row => ({
    id: row.id,
    agencyName: row.agency_name,
    managerName: row.manager_name,
    employeeName: row.employee_name,
    storeName: row.store_name,
    storeAddress: row.store_address,
    bankName: row.bank_name,
    accountNumber: row.account_number,
    status: row.status,
    incentiveAmount: row.incentive_amount,
    createdAt: row.created_at,
    productPhotos: [],
    storeSignboard: [],
    transactionDocs: []
  }))
}

/**
 * Get application by ID (with full file data)
 */
export async function getApplicationById(id: string): Promise<Application | undefined> {
  const { data: app, error: appError } = await supabaseAdmin
    .from('applications')
    .select('*')
    .eq('id', id)
    .single()

  if (appError || !app) return undefined

  const { data: files, error: filesError } = await supabaseAdmin
    .from('file_attachments')
    .select('*')
    .eq('application_id', id)

  if (filesError) throw new Error(`Failed to fetch files: ${filesError.message}`)

  return rowToApplication(app, files || [])
}

/**
 * Add new application with file uploads
 * When NEXT_PUBLIC_SUPABASE_URL is not set, falls back to in-memory store for local development.
 */
export async function addApplication(
  app: Omit<Application, "id" | "status" | "createdAt" | "incentiveAmount">
): Promise<Application> {
  // Supabase 미설정 시 in-memory 저장으로 fallback (로컬 개발 환경)
  if (!isSupabaseConfigured()) {
    console.log('Skipping Supabase in local development')
    const result = memoryStore.addApplication(app)
    return result
  }

  // 1. Insert application record
  const { data: newApp, error: appError } = await supabaseAdmin
    .from('applications')
    .insert({
      agency_name: app.agencyName,
      manager_name: app.managerName,
      employee_name: app.employeeName,
      store_name: app.storeName,
      store_address: app.storeAddress,
      bank_name: app.bankName,
      account_number: app.accountNumber,
      status: 'pending',
      incentive_amount: 7000
    })
    .select()
    .single()

  if (appError || !newApp) {
    throw new Error(`Failed to create application: ${appError?.message}`)
  }

  // 2. Save file references (files are already uploaded from client)
  const saveFileReferences = async (
    files: FileAttachment[],
    category: 'product_photos' | 'store_signboard' | 'transaction_docs'
  ) => {
    for (const file of files) {
      if (!file.data) continue

      try {
        // Extract storage path from URL
        // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
        const bucketName = category === 'product_photos' ? 'product-photos' :
                          category === 'store_signboard' ? 'store-signboards' :
                          'transaction-docs'
        const urlParts = file.data.split(`/${bucketName}/`)
        const storagePath = urlParts.length > 1 ? urlParts[1] : file.data

        await supabaseAdmin.from('file_attachments').insert({
          application_id: newApp.id,
          file_category: category,
          file_name: file.name,
          file_type: file.type,
          storage_path: storagePath,
          storage_url: file.data
        })
      } catch (saveErr) {
        console.warn(`Failed to save file reference (${category}):`, saveErr)
        // 저장 실패해도 throw하지 않음 - 신청서는 이미 생성됨
      }
    }
  }

  try {
    await Promise.all([
      saveFileReferences(app.productPhotos, 'product_photos'),
      saveFileReferences(app.storeSignboard, 'store_signboard'),
      saveFileReferences(app.transactionDocs, 'transaction_docs')
    ])
  } catch (saveError) {
    // 저장 실패 시에도 에러 throw하지 않음
    console.warn('Failed to save file references, application created without files:', saveError)
  }

  // 3. Fetch and return complete application
  const completeApp = await getApplicationById(newApp.id)
  if (!completeApp) throw new Error('Failed to fetch created application')

  return completeApp
}

/**
 * Update application status
 */
export async function updateApplicationStatus(
  id: string,
  status: "approved" | "rejected"
): Promise<Application | null> {
  const { data, error } = await supabaseAdmin
    .from('applications')
    .update({ status })
    .eq('id', id)
    .select()
    .single()

  if (error || !data) return null

  return await getApplicationById(id) || null
}

/**
 * Delete application and its files
 */
export async function deleteApplication(id: string): Promise<boolean> {
  try {
    // 1. Delete files from Storage
    await deleteFilesByApplicationId(id)

    // 2. Delete file records (CASCADE will handle this, but explicit is clearer)
    await supabaseAdmin
      .from('file_attachments')
      .delete()
      .eq('application_id', id)

    // 3. Delete application record
    const { error } = await supabaseAdmin
      .from('applications')
      .delete()
      .eq('id', id)

    return !error
  } catch {
    return false
  }
}

/**
 * Get agency summaries
 */
export async function getAgencySummaries(): Promise<AgencySummary[]> {
  const { data: apps, error } = await supabaseAdmin
    .from('applications')
    .select('agency_name, bank_name, account_number, incentive_amount')
    .eq('status', 'approved')

  if (error || !apps) return []

  const map = new Map<string, AgencySummary>()

  for (const app of apps) {
    const key = app.agency_name
    if (!map.has(key)) {
      map.set(key, {
        agencyName: app.agency_name,
        bankName: app.bank_name,
        accountNumber: app.account_number,
        participationCount: 0,
        totalAmount: 0
      })
    }
    const summary = map.get(key)!
    summary.participationCount += 1
    summary.totalAmount += app.incentive_amount
    summary.bankName = app.bank_name
    summary.accountNumber = app.account_number
  }

  return Array.from(map.values())
}

/**
 * Get statistics
 */
export async function getStats() {
  const { data: apps, error } = await supabaseAdmin
    .from('applications')
    .select('status, agency_name, incentive_amount')

  if (error || !apps) {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      agencyParticipation: {},
      totalIncentive: 0
    }
  }

  const total = apps.length
  const pending = apps.filter(a => a.status === 'pending').length
  const approved = apps.filter(a => a.status === 'approved').length
  const rejected = apps.filter(a => a.status === 'rejected').length

  const agencyMap = new Map<string, number>()
  for (const app of apps.filter(a => a.status !== 'rejected')) {
    const count = agencyMap.get(app.agency_name) || 0
    agencyMap.set(app.agency_name, count + 1)
  }

  const totalIncentive = apps
    .filter(a => a.status === 'approved')
    .reduce((sum, a) => sum + a.incentive_amount, 0)

  return {
    total,
    pending,
    approved,
    rejected,
    agencyParticipation: Object.fromEntries(agencyMap),
    totalIncentive
  }
}
