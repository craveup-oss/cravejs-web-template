"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import useSWR from "swr";
import { fulfillmentRoutes } from "../routes";
import { fulfillmentModeLabels } from "../types";
import { readCurrentFulfillmentDetail, type ModeSwitchRuntime } from "./mode-switch-runtime";

/** Observe the canonical tab-scoped cart; never select a mode or start a session. */
export function FulfillmentStatus({locationId, runtime}: {
  locationId: string;
  runtime: ModeSwitchRuntime;
}) {
  const pathname = usePathname();
  const {data, error} = useSWR(["fulfillment-status", runtime, locationId, pathname],
    () => readCurrentFulfillmentDetail(runtime, locationId),
    {revalidateOnMount: true, shouldRetryOnError: false, dedupingInterval: 0});
  const label = !error && data ? fulfillmentModeLabels[data.mode] : null;
  return <div className="bakery-fulfillment-bar" aria-label="Order fulfillment">
    <span>{label ?? "Choose pickup or delivery"}</span>
    <Link href={fulfillmentRoutes.mode(locationId)}>{label ? "Change" : "Select option"} <span aria-hidden="true">→</span></Link>
  </div>;
}
