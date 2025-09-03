import { GetServerSideProps } from "next";
import Head from "next/head";
import { useEffect } from "react";

type ShareData = {
  id: string;
  organization_id: string;
  scope: "dashboard" | "metrics" | "requests" | "logs";
  filters: any | null;
  time_start: string | null;
  time_end: string | null;
  name: string | null;
  allow_request_bodies: boolean;
};

interface Props {
  share: ShareData | null;
}

export default function PublicSharePage({ share }: Props) {
  useEffect(() => {
    // Could initialize any client-side context if needed
  }, [share]);

  if (!share) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-semibold">Link not found or expired</h1>
          <p className="text-muted-foreground mt-2">Please contact the owner for a new link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Head>
        <title>{share.name ? `${share.name} • Shared` : "Shared Dashboard"}</title>
      </Head>
      <main className="mx-auto max-w-7xl px-4 py-6">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Shared {share.scope}</h1>
          {share.name ? <p className="text-muted-foreground text-sm">{share.name}</p> : null}
        </div>
        {/* Minimal embed: reuse existing public stats as placeholder for dashboard */}
        {/* Follow-up: we can hydrate dashboard components to respect filters/time window */}
        <iframe
          src="/open-stats"
          className="h-[70vh] w-full rounded-lg border border-border"
          title="Shared Metrics"
        />
      </main>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  const id = ctx.params?.id as string;
  try {
    const baseUrl = process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE || "";
    const resp = await fetch(`${baseUrl}/v1/public/share/${id}`);
    if (!resp.ok) {
      return { props: { share: null } };
    }
    const json = await resp.json();
    if (json?.data) {
      return { props: { share: json.data } };
    }
  } catch (_) {}
  return { props: { share: null } };
};


