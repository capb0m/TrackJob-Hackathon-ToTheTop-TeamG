import { supabaseAdmin } from '../clients/supabase'

export async function ensureBucketExists(bucketName: string) {
  try {
    const { data: buckets } = await supabaseAdmin.storage.listBuckets()
    if (buckets?.find((b) => b.name === bucketName)) {
      return
    }

    await supabaseAdmin.storage.createBucket(bucketName, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    })
  } catch (error) {
    console.error(`Failed to ensure bucket ${bucketName} exists:`, error)
  }
}
