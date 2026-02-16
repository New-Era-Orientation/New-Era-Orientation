// Server wrapper to control rendering behavior for the /simulation route.
// The actual UI lives in a client component.

export const dynamic = "force-dynamic";

import SimulationClient from "./SimulationClient";

export default function SimulationPage() {
  return <SimulationClient />;
}
