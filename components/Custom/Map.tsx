"use client"

import { APIProvider, Map } from "@vis.gl/react-google-maps"

interface PaymentsMapArgs {
  payments: string[]
  apiKey: string
}

export function PaymentsMap(args: PaymentsMapArgs) {
  return (<APIProvider apiKey={args.apiKey}>
    <Map
      defaultCenter={{ lat: 22.54992, lng: 0 }}
      defaultZoom={3}
      gestureHandling='greedy'
      disableDefaultUI
    />
  </APIProvider>
  )
}
