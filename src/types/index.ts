export type Role = 'owner' | 'admin' | 'manager' | 'employee'
export type ShiftStatus = 'activo' | 'completado' | 'pendiente' | 'cancelado'
export type RequestStatus = 'pendiente' | 'aprobada' | 'rechazada'
export type NotifType = 'shift_change' | 'request_approved' | 'request_rejected' | 'new_message' | 'new_request'

export interface Profile {
  id: string
  user_id: string | null
  company_id: string
  store_id: string | null
  department_id: string | null
  full_name: string
  login_code: string
  role: Role
  created_at: string
}

export interface Company {
  id: string
  name: string
  created_at: string
}

export interface Store {
  id: string
  company_id: string
  name: string
  created_at: string
}

export interface Department {
  id: string
  company_id: string
  store_id: string | null
  name: string
  created_at: string
}

export interface ScheduleEvent {
  id: string
  company_id: string
  store_id: string | null
  employee_id: string
  manager_id: string
  department_id: string | null
  title: string
  shift_date: string
  start_time: string
  end_time: string
  break_minutes: number
  lunch_minutes: number
  total_hours: number
  notes: string
  status: ShiftStatus
  created_at: string
  updated_at: string
  employee?: Pick<Profile, 'id' | 'full_name' | 'department_id'>
  department?: Pick<Department, 'id' | 'name'>
}

export interface ShiftChangeRequest {
  id: string
  company_id: string
  requester_employee_id: string
  target_employee_id: string
  current_shift_id: string
  requested_shift_id: string
  requested_change_date: string
  reason: string
  additional_message: string
  status: RequestStatus
  manager_response: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  created_at: string
  updated_at: string
  requester?: Pick<Profile, 'id' | 'full_name'>
  target?: Pick<Profile, 'id' | 'full_name'>
  current_shift?: Pick<ScheduleEvent, 'id' | 'shift_date' | 'start_time' | 'end_time'>
  requested_shift?: Pick<ScheduleEvent, 'id' | 'shift_date' | 'start_time' | 'end_time'>
}

export interface Conversation {
  id: string
  company_id: string
  created_at: string
  members?: Profile[]
  last_message?: Message
  unread_count?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  receiver_id: string | null
  message: string
  read_at: string | null
  created_at: string
  sender?: Pick<Profile, 'id' | 'full_name'>
}

export interface Notification {
  id: string
  company_id: string
  user_id: string
  type: NotifType
  title: string
  message: string
  read_at: string | null
  created_at: string
}

export interface AppSession {
  userId: string
  profile: Profile
  company: Company
}
