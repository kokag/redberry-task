import { api } from "@/boot/axios";
import type {
  Order,
  OrderPayload,
  SeatHold,
  SeatMap
} from "@/api/resources/Booking";
import type { Session } from "@/api/resources/Session";

export const fetchSession = async (id: number) => {
  const { data } = await api.get<{ data: Session }>(`/sessions/${id}`);
  return data.data;
};

export const fetchSeatMap = async (sessionId: number) => {
  const { data } = await api.get<{ data: SeatMap }>(
    `/sessions/${sessionId}/seats`
  );
  return data.data;
};

// Holding again replaces the user's previous hold for this session
export const holdSeats = async (
  sessionId: number,
  seats: { seatId: number; ticketType: string }[]
) => {
  const { data } = await api.post<{ data: SeatHold }>(
    `/sessions/${sessionId}/holds`,
    { seats }
  );
  return data.data;
};

export const releaseHold = async (holdId: string) => {
  await api.delete(`/holds/${holdId}`);
};

export const payOrder = async (payload: OrderPayload) => {
  const { data } = await api.post<{ data: Order }>("/orders", payload);
  return data.data;
};
