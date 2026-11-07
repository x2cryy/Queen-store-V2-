export const MOCK_LABEL = "معاينة ببيانات تجريبية";

export type PreviewMode = "data" | "empty" | "loading" | "error";

export type OrderStatus = "new" | "processing" | "done" | "cancelled" | "returned";
export type PayStatus = "paid" | "partial" | "unpaid";

export type OrderItem = { name: string; option: string | null; qty: number; unit: number };
export type Order = {
  id: number;
  customer: string;
  createdAt: string; // ISO
  items: OrderItem[];
  status: OrderStatus;
  pay: PayStatus;
  phone: string | null;
  area: string | null;
  address: string | null;
  notes: string | null;
  discount: number | null;
  fees: { label: string; amount: number }[];
  hasReceipt: boolean;
  hasChat: boolean;
};

export type Summary = {
  newToday: number;
  processing: number;
  salesToday: number;
  collectedToday: number;
  // null = المقارنة غير متاحة
  newYesterday: number | null;
  salesYesterday: number | null;
};

export type StockItem = {
  id: number;
  name: string;
  option: string | null;
  qty: number;
  threshold: number | null;
  state: "low" | "out";
};

export type FollowUp = {
  key: "messages" | "qicard" | "store_debts" | "store_installments";
  label: string;
  count: number | null; // null = غير مدعوم أو لا صلاحية
  note: string;
  href: string;
};

export type HomeData = {
  summary: Summary;
  orders: Order[];
  ordersTotal: number;
  stock: StockItem[];
  follow: FollowUp[];
};

const at = (hoursAgo: number) => new Date(Math.floor(Date.now() / 3_600_000) * 3_600_000 - hoursAgo * 3_600_000).toISOString();

export const MOCK_ORDERS: Order[] = [
  {
    id: 1048, customer: "سارة الجبوري", createdAt: at(1),
    items: [
      { name: "حقيبة يد جلدية", option: "بني", qty: 1, unit: 185_000 },
      { name: "وشاح حرير", option: "أزرق", qty: 2, unit: 45_000 },
    ],
    status: "new", pay: "unpaid", phone: "0770 000 0001", area: "بغداد - الكرادة",
    address: "قرب ساحة كهرمانة، عمارة رقم 12", notes: "الرجاء الاتصال قبل التوصيل بنصف ساعة.\nالتغليف كهدية.",
    discount: null, fees: [], hasReceipt: false, hasChat: true,
  },
  {
    id: 1047, customer: "أحمد الكعبي", createdAt: at(3),
    items: [{ name: "حذاء رياضي", option: "المقاس 43", qty: 1, unit: 120_000 }],
    status: "processing", pay: "paid", phone: "0770 000 0002", area: "بغداد - المنصور",
    address: "شارع 14 رمضان", notes: null,
    discount: 10_000, fees: [], hasReceipt: true, hasChat: true,
  },
  {
    id: 1046, customer: "زينب العبيدي", createdAt: at(6),
    items: [
      { name: "عطر نسائي 100 مل", option: null, qty: 2, unit: 95_000 },
      { name: "محفظة جلدية", option: "أسود", qty: 1, unit: 60_000 },
      { name: "نظارة شمسية", option: null, qty: 1, unit: 75_000 },
    ],
    status: "processing", pay: "partial", phone: "0770 000 0003", area: "البصرة - العشار",
    address: "قرب جسر الحرية", notes: "توصيل بعد الساعة 5 مساءً فقط.",
    discount: null, fees: [{ label: "رسوم الدفع الإلكتروني", amount: 3_000 }], hasReceipt: true, hasChat: false,
  },
  {
    id: 1045, customer: "علي الموسوي", createdAt: at(27),
    items: [{ name: "ساعة يد", option: "فضي", qty: 1, unit: 210_000 }],
    status: "done", pay: "paid", phone: null, area: "النجف",
    address: null, notes: null, discount: null, fees: [], hasReceipt: true, hasChat: true,
  },
  {
    id: 1044, customer: "نور الساعدي", createdAt: at(30),
    items: [{ name: "حزام رجالي", option: "بني", qty: 3, unit: 40_000 }],
    status: "cancelled", pay: "unpaid", phone: "0770 000 0005", area: "كربلاء",
    address: "حي الحسين", notes: "ألغى الزبون الطلب قبل التجهيز.",
    discount: null, fees: [], hasReceipt: false, hasChat: false,
  },
];

export const MOCK_DATA: HomeData = {
  summary: {
    newToday: 7,
    processing: 5,
    salesToday: 1_245_000,
    collectedToday: 830_000,
    newYesterday: 9,
    salesYesterday: null, // مقارنة غير متاحة: تُعرض "لا تتوفر مقارنة"
  },
  orders: MOCK_ORDERS,
  ordersTotal: 7,
  stock: [
    { id: 1, name: "وشاح حرير", option: "أخضر", qty: 0, threshold: 5, state: "out" },
    { id: 2, name: "عطر نسائي 100 مل", option: null, qty: 2, threshold: 8, state: "low" },
    { id: 3, name: "حذاء رياضي", option: "المقاس 42", qty: 1, threshold: 3, state: "low" },
    { id: 4, name: "محفظة جلدية", option: "بني", qty: 3, threshold: null, state: "low" },
  ],
  follow: [
    { key: "messages", label: "رسائل غير مقروءة", count: 4, note: "محادثات بانتظار الرد", href: "/admin/chats" },
    { key: "qicard", label: "تحويلات كي كارد بانتظار المراجعة", count: 2, note: "تحتاج تأكيدًا قبل التجهيز", href: "/admin/payments" },
    { key: "store_debts", label: "ديون المتجر المستحقة", count: 1, note: "مستحقات على المتجر حان موعدها", href: "/admin/debts/store" },
    { key: "store_installments", label: "أقساط المتجر", count: null, note: "غير معروضة: لا يميّز النظام بعد القسط الشخصي عن قسط المتجر", href: "/admin/debts/installments" },
  ],
};

export const EMPTY_DATA: HomeData = {
  summary: { newToday: 0, processing: 0, salesToday: 0, collectedToday: 0, newYesterday: null, salesYesterday: null },
  orders: [],
  ordersTotal: 0,
  stock: [],
  follow: [],
};
