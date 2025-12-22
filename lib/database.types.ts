// This file will contain auto-generated Supabase types
// Run: npx supabase gen types typescript --project-id <project-id> > lib/database.types.ts
// Or use the Supabase CLI to generate types

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      // TODO: Add your database table types here
    }
    Views: {
      // TODO: Add your database view types here
    }
    Functions: {
      // TODO: Add your database function types here
    }
    Enums: {
      // TODO: Add your database enum types here
    }
  }
}

