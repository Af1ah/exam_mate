import { Redirector } from "@/components/redirector";
export default async function MagicLinkPage({ params }: { params: Promise<{ token: string }> }) { return <Redirector token={(await params).token} />; }
