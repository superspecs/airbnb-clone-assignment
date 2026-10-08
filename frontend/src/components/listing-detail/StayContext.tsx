"use client";

import { createContext, type ReactNode, useContext, useMemo, useState } from "react";

import { blockedNights, isStayFree } from "@/lib/stay";
import type { BlockedRange } from "@/lib/types/listing";

interface StayState {
  listingId: number;
  maxGuests: number;
  today: string;
  blocked: Set<string>;
  checkIn: string | null;
  checkOut: string | null;
  guests: number;
  setDates: (checkIn: string | null, checkOut: string | null) => void;
  setGuests: (guests: number) => void;
}

const StayContext = createContext<StayState | null>(null);

export function useStay(): StayState {
  const value = useContext(StayContext);
  if (!value) throw new Error("useStay must be used inside <StayProvider>");
  return value;
}

interface StayProviderProps {
  listingId: number;
  maxGuests: number;
  today: string;
  blockedRanges: BlockedRange[];
  initial: { checkIn?: string; checkOut?: string; guests?: number };
  children: ReactNode;
}

/** Shares the selected stay between the inline calendar and the sticky booking widget. */
export function StayProvider({ listingId, maxGuests, today, blockedRanges, initial, children }: StayProviderProps) {
  const blocked = useMemo(() => blockedNights(blockedRanges), [blockedRanges]);

  // Only accept prefilled dates (from Explore) that are still valid for this listing.
  const initialValid =
    !!initial.checkIn &&
    !!initial.checkOut &&
    initial.checkIn >= today &&
    initial.checkOut > initial.checkIn &&
    isStayFree(initial.checkIn, initial.checkOut, blocked);

  const [checkIn, setCheckIn] = useState<string | null>(initialValid ? initial.checkIn! : null);
  const [checkOut, setCheckOut] = useState<string | null>(initialValid ? initial.checkOut! : null);
  const [guests, setGuests] = useState(Math.min(Math.max(initial.guests ?? 1, 1), maxGuests));

  const value: StayState = {
    listingId,
    maxGuests,
    today,
    blocked,
    checkIn,
    checkOut,
    guests,
    setDates: (inDate, outDate) => {
      setCheckIn(inDate);
      setCheckOut(outDate);
    },
    setGuests,
  };

  return <StayContext.Provider value={value}>{children}</StayContext.Provider>;
}
