import { Redirector } from "@/components/redirector";
export const dynamic = "force-dynamic";
export default async function MagicLinkPage({ params }: { params: Promise<{ token: string }> }) {
  return <Redirector token={(await params).token} />;
}
