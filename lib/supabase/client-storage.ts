import { supabaseBrowser } from './client'

const BUCKET_MAP = {
  productPhotos: 'product-photos',
  storeSignboard: 'store-signboards',
  transactionDocs: 'transaction-docs'
} as const

export type FileCategory = 'productPhotos' | 'storeSignboard' | 'transactionDocs'

export interface UploadedFile {
  fileName: string
  fileType: string
  storageUrl: string
}

/**
 * Upload file directly from browser to Supabase Storage
 * This bypasses API Route to avoid Vercel's 413 Payload Too Large error
 */
export async function uploadFileFromBrowser(
  file: File,
  category: FileCategory,
  tempApplicationId?: string
): Promise<UploadedFile> {
  const bucket = BUCKET_MAP[category]

  // Use temporary ID for uploads before application creation
  const appId = tempApplicationId || `temp-${Date.now()}`
  const fileExt = file.name.split('.').pop() || 'jpg'
  const uniqueFileName = `${appId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  const { data, error } = await supabaseBrowser.storage
    .from(bucket)
    .upload(uniqueFileName, file, {
      contentType: file.type,
      upsert: false
    })

  if (error) {
    throw new Error(`파일 업로드 실패: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseBrowser.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    fileName: file.name,
    fileType: file.type,
    storageUrl: publicUrl
  }
}

/**
 * Delete file from storage (cleanup on error or file removal)
 */
export async function deleteFileFromBrowser(
  category: FileCategory,
  storageUrl: string
): Promise<void> {
  const bucket = BUCKET_MAP[category]

  // Extract path from URL
  // URL format: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
  const urlParts = storageUrl.split(`/${bucket}/`)
  if (urlParts.length < 2) return

  const path = urlParts[1]

  const { error } = await supabaseBrowser.storage
    .from(bucket)
    .remove([path])

  if (error) {
    console.error('파일 삭제 실패:', error)
  }
}
