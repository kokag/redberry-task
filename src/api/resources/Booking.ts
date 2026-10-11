import type { Session } from "@/api/resources/Session";

export interface Seat {
  // Sent as `seatId` when holding; never send `code`
  id: number;
  // "E7": for summaries, orders and tickets
  code: string;
  // "7": goes inside the seat button
  label: string;
  state: "available" | "sold" | "held" | "unavailable";
  aisleAfter: boolean;
  // Part of the user's own live hold
  isMine: boolean;
}

export interface SeatMap {
  sessionId: number;
  sections: {
    name: string;
    rows: { label: string; seats: Seat[] }[];
  }[];
}

export interface SeatHold {
  holdId: string;
  sessionId: number;
  expiresAt: string;
  secondsRemaining: number;
  isLive: boolean;
  subtotal: number;
}

export interface Order {
  id: number;
  reference: string;
  totalPrice: number;
  // Paid and the session hasn't started: puts the order in the Upcoming tab
  isUpcoming: boolean;
  // Drives the Refund button; already false inside the 2 hour cutoff and once refunded
  isRefundable: boolean;
  session: Session;
  tickets: {
    id: number;
    seatCode: string;
    ticketType: { slug: string; name: string };
    price: number;
  }[];
}

export interface OrderPayload {
  holdId: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}
