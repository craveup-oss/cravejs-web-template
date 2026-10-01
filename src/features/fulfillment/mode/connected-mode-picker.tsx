"use client";

import { useEffect, useState } from "react";

import type { FulfillmentDetail, FulfillmentMode } from "../types";
import { ModePicker } from "./mode-picker";
import {
  readCurrentFulfillmentDetail,
  switchFulfillmentMode,
  type ModeSwitchRuntime,
} from "./mode-switch-runtime";

export function ConnectedModePicker({
  detail,
  enabledModes,
  locationId,
  runtime,
}: {
  readonly detail: FulfillmentDetail;
  readonly enabledModes: readonly FulfillmentMode[];
  readonly locationId: string;
  readonly runtime: ModeSwitchRuntime;
}) {
  // The cart lives in this tab's session, so the server-rendered default is replaced on the client.
  const [currentDetail, setCurrentDetail] = useState(detail);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    readCurrentFulfillmentDetail(runtime, locationId).then(
      (cartDetail) => {
        if (active && cartDetail && enabledModes.includes(cartDetail.mode)) {
          setCurrentDetail(cartDetail);
        }
        if (active) setLoading(false);
      },
      () => { if (active) setLoading(false); },
    );
    return () => {
      active = false;
    };
  }, [enabledModes, locationId, runtime]);

  // A late initial read must not overwrite a choice or mutation made by the customer.
  if (loading) return <p role="status">Loading your order choice…</p>;

  return (
    <ModePicker
      detail={currentDetail}
      enabledModes={enabledModes}
      locationId={locationId}
      onRequestMode={(request) =>
        switchFulfillmentMode(runtime, locationId, request.requestedMode)
      }
    />
  );
}
