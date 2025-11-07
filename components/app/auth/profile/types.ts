import { UserProfile } from "@/lib/user-profile"
import { Models } from "appwrite"

export interface ProfileFormData {
  name: string
  email: string
  bio: string
  location: string
  website: string
  timezone: string
  language: 'en' | 'ms'
  theme: 'light' | 'dark' | 'system'
  notificationsEnabled: boolean
}

export interface ProfilePageProps {
  user: Models.User<Models.Preferences>
  userProfile: UserProfile | null
  formData: ProfileFormData
  isUpdating: boolean
  onInputChange: (field: string, value: string | boolean) => void
  onSubmit: (e: React.FormEvent) => Promise<void>
}

