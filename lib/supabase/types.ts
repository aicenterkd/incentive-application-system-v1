// Database types matching Supabase schema
export interface Database {
  public: {
    Tables: {
      applications: {
        Row: {
          id: string
          agency_name: string
          manager_name: string
          employee_name: string
          store_name: string
          store_address: string
          bank_name: string
          account_number: string
          status: 'pending' | 'approved' | 'rejected'
          incentive_amount: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }
      file_attachments: {
        Row: {
          id: string
          application_id: string
          file_category: 'product_photos' | 'store_signboard' | 'transaction_docs'
          file_name: string
          file_type: string
          storage_path: string
          storage_url: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['file_attachments']['Row'], 'id' | 'created_at'>
        Update: Partial<Database['public']['Tables']['file_attachments']['Insert']>
      }
    }
  }
}

export type ApplicationRow = Database['public']['Tables']['applications']['Row']
export type FileAttachmentRow = Database['public']['Tables']['file_attachments']['Row']
