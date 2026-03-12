import type { MetricKey } from "@/types/domain";

export type MetricConfig = {
  key: MetricKey;
  section: "buyer" | "seller";
  label: string;
  hint?: string;
};

export const METRICS: MetricConfig[] = [
  {
    key: "buyer_incoming_lead_total",
    section: "buyer",
    label: "Incoming lead - total",
    hint: "Все входящие лиды",
  },
  {
    key: "buyer_contact_established",
    section: "buyer",
    label: "Contact established",
    hint: "Контакт установлен",
  },
  {
    key: "buyer_qualified",
    section: "buyer",
    label: "Qualified (Cold+Warm+Hot)",
    hint: "Квалифицированные",
  },
  {
    key: "buyer_agents",
    section: "buyer",
    label: "Agents",
    hint: "Агенты",
  },
  {
    key: "buyer_meeting_confirmed",
    section: "buyer",
    label: "Meeting Confirmed",
    hint: "Подтвержденные встречи",
  },
  {
    key: "buyer_meeting_held",
    section: "buyer",
    label: "Meeting (Office/Zoom/Viewing)",
    hint: "Проведенные встречи",
  },
  {
    key: "buyer_number_of_bookings",
    section: "buyer",
    label: "Number of bookings",
    hint: "Бронирования",
  },
  {
    key: "buyer_booking_commission_amount",
    section: "buyer",
    label: "Booking commission amount",
    hint: "Комиссия по бронированию",
  },
  {
    key: "seller_incoming_requests",
    section: "seller",
    label: "Incoming requests - seller",
    hint: "Входящие запросы от продавцов",
  },
  {
    key: "seller_number_of_cold_calls",
    section: "seller",
    label: "Number of cold calls",
    hint: "Холодные звонки",
  },
  {
    key: "seller_requested_documents",
    section: "seller",
    label: "Requested documents",
    hint: "Запрошены документы",
  },
  {
    key: "seller_sent_contract",
    section: "seller",
    label: "Sent the contract",
    hint: "Договор отправлен",
  },
  {
    key: "seller_objects_entered_xoms",
    section: "seller",
    label: "Objects entered into Xoms",
    hint: "Объекты внесены в Xoms",
  },
  {
    key: "seller_listed_property",
    section: "seller",
    label: "Listed the property",
    hint: "Выставлено в рекламу",
  },
  {
    key: "seller_sold_objects",
    section: "seller",
    label: "Sold objects",
    hint: "Продано объектов",
  },
  {
    key: "seller_total_sales_amount",
    section: "seller",
    label: "Total sales amount",
    hint: "Суммарный объем продаж",
  },
];

