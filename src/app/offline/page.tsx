import Link from "next/link";

export default function OfflinePage() {
  return (
    <div className="p-4">
      <h1>Offline Mode</h1>
      <Link href="/navigation">Return to Navigation Page</Link>
      <p>You&apos;re currently offline. Please check your connection.</p>
    </div>
  );
}
