export const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
export const GBP_TO_INR = 105; // UK-trained model; UI speaks Rupees, API speaks Pounds

const inrFmt = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
export const inr = (v: number) => inrFmt.format(v);
export const toGBP = (rupees: number) => rupees / GBP_TO_INR;

export type Segment = {
  id: number;
  name: string;
  blurb: string;
  customers: number;
  share: number;
  rev_share: number;
  recency: number;
  frequency: number;
  monetary: number; // GBP, as stored
};

export type Prediction = {
  segment: Segment;
  distances: number[];
  profile: Segment;
  stored: boolean;
};

export type HistoryRow = {
  id: number;
  recency_days: number;
  frequency_orders: number;
  monetary_gbp: number;
  segment_id: number;
  segment_name: string;
  created_at: string | null;
};
