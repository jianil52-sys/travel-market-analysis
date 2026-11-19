import Dashboard from "@/app/dashboard";
import demoJapan from "@/data/demo-japan.json";
import type { DemoDataset } from "@/app/types";

export default function HomePage() {
  return <Dashboard demoDataset={demoJapan as DemoDataset} />;
}
