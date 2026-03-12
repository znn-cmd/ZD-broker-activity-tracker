export enum UserRole {
  Manager = "manager",
  Head = "head",
  Admin = "admin",
}

export type UserRecord = {
  userId: string;
  fullName: string;
  email: string;
  username: string;
  passwordHash: string;
  role: UserRole;
  teamId: string | null;
  teamName: string | null;
  isActive: boolean;
  telegramChatId: string | null;
  reminderEmail: string | null;
  createdAt: string;
  updatedAt: string;
};

export type DailyReportRecord = {
  reportId: string;
  userId: string;
  reportDate: string; // ISO date (YYYY-MM-DD)
  buyer_incoming_lead_total: number;
  buyer_contact_established: number;
  buyer_qualified: number;
  buyer_agents: number;
  buyer_meeting_confirmed: number;
  buyer_meeting_held: number;
  buyer_number_of_bookings: number;
  buyer_booking_commission_amount: number;
  seller_incoming_requests: number;
  seller_number_of_cold_calls: number;
  seller_requested_documents: number;
  seller_sent_contract: number;
  seller_objects_entered_xoms: number;
  seller_listed_property: number;
  seller_sold_objects: number;
  seller_total_sales_amount: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

export type MonthlyPlanRecord = {
  planId: string;
  userId: string;
  teamId: string | null;
  year: number;
  month: number;
  metricKey: MetricKey;
  planValue: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
};

export type CommentTargetType = "daily_report" | "user_period" | "plan_review";
export type CommentVisibility = "manager_private" | "manager_to_broker" | "admin_internal";

export type CommentRecord = {
  commentId: string;
  targetType: CommentTargetType;
  targetId: string;
  subjectUserId: string;
  authorUserId: string;
  visibility: CommentVisibility;
  commentText: string;
  createdAt: string;
  updatedAt: string;
};

export type ReminderRecord = {
  reminderId: string;
  userId: string;
  reportDate: string;
  channel: string;
  status: string;
  sentAt: string;
  payloadJson: string;
  createdAt: string;
};

export type AuditLogEntry = {
  logId: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  payloadJson: string;
  createdAt: string;
};

export type MetricKey =
  // Buyer
  | "buyer_incoming_lead_total"
  | "buyer_contact_established"
  | "buyer_qualified"
  | "buyer_agents"
  | "buyer_meeting_confirmed"
  | "buyer_meeting_held"
  | "buyer_number_of_bookings"
  | "buyer_booking_commission_amount"
  // Seller
  | "seller_incoming_requests"
  | "seller_number_of_cold_calls"
  | "seller_requested_documents"
  | "seller_sent_contract"
  | "seller_objects_entered_xoms"
  | "seller_listed_property"
  | "seller_sold_objects"
  | "seller_total_sales_amount";

