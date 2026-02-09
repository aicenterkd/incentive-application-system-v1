import { supabaseAdmin } from './client'

const BUCKET_MAP = {
  productPhotos: 'product-photos',
  storeSignboard: 'store-signboards',
  transactionDocs: 'transaction-docs'
} as const

type FileCategory = 'product_photos' | 'store_signboard' | 'transaction_docs'

const CATEGORY_TO_BUCKET: Record<FileCategory, string> = {
  product_photos: BUCKET_MAP.productPhotos,
  store_signboard: BUCKET_MAP.storeSignboard,
  transaction_docs: BUCKET_MAP.transactionDocs
}

export interface FileUploadResult {
  fileName: string
  fileType: string
  storagePath: string
  storageUrl: string
}

/**
 * Upload base64 file to Supabase Storage
 */
export async function uploadFile(
  base64Data: string,
  fileName: string,
  fileType: string,
  category: FileCategory,
  applicationId: string
): Promise<FileUploadResult> {
  // Extract base64 content (remove data:image/jpeg;base64, prefix)
  const base64Content = base64Data.split(',')[1] || base64Data
  const buffer = Buffer.from(base64Content, 'base64')

  const bucket = CATEGORY_TO_BUCKET[category]
  const fileExt = fileName.split('.').pop() || 'jpg'
  const uniqueFileName = `${applicationId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(uniqueFileName, buffer, {
      contentType: fileType,
      upsert: false
    })

  if (error) {
    throw new Error(`Failed to upload file: ${error.message}`)
  }

  // Get public URL
  const { data: { publicUrl } } = supabaseAdmin.storage
    .from(bucket)
    .getPublicUrl(data.path)

  return {
    fileName,
    fileType,
    storagePath: data.path,
    storageUrl: publicUrl
  }
}

/**
 * Delete files from storage by application ID
 */
export async function deleteFilesByApplicationId(applicationId: string): Promise<void> {
  const buckets = Object.values(BUCKET_MAP)

  const deletePromises = buckets.map(async (bucket) => {
    // List all files in the application folder
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from(bucket)
      .list(applicationId)

    if (listError || !files || files.length === 0) {
      return
    }

    // Delete all files
    const filePaths = files.map(file => `${applicationId}/${file.name}`)
    const { error: deleteError } = await supabaseAdmin.storage
      .from(bucket)
      .remove(filePaths)

    if (deleteError) {
      console.error(`Error deleting files from ${bucket}:`, deleteError)
    }
  })

  await Promise.all(deletePromises)
}

/**
 * Delete specific file from storage
 */
export async function deleteFile(bucket: string, path: string): Promise<void> {
  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .remove([path])

  if (error) {
    throw new Error(`Failed to delete file: ${error.message}`)
  }
}
