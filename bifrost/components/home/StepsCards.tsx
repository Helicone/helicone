import StepsCard from "@/components/home/StepsCard";
import { User, Key, Activity } from "lucide-react";

export default function StepsCards() {
  return (
    <div className="w-full h-full flex flex-col antialiased relative">
      <div className="flex flex-col gap-8 w-full h-full justify-center pt-16 pb-24 items-center text-center px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 max-w-3xl">
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-foreground">
            How it works
          </h1>
          <p className="text-lg font-normal sm:text-xl text-muted-foreground">Start shipping in less than 2 minutes</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl w-full mt-8">
          <StepsCard
            stepNumber={1}
            title="Set up your account"
            description="Get your API key and add credits that don't expire and work with every model."
            icon={
              <div className="flex items-center gap-2">
                <Key size={20} className="text-primary" />
                <div className="flex gap-2 h-5">
                  <span className="text-sm text-muted-foreground font-mono">
                    HELICONE_API_KEY
                  </span>
                </div>
              </div>
            }
            content={
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between py-3 border-b border-border">
                  <span className="text-sm text-muted-foreground">Apr 1</span>
                  <div className="flex gap-2 items-center">
                    <div className="w-24 h-4 bg-muted rounded"></div>
                    <span className="text-lg font-semibold text-foreground">
                      $99
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm text-muted-foreground">Mar 30</span>
                  <div className="flex gap-2 items-center">
                    <div className="w-24 h-4 bg-muted rounded"></div>
                    <span className="text-lg font-semibold text-foreground">
                      $10
                    </span>
                  </div>
                </div>
              </div>
            }
          />

          <StepsCard
            stepNumber={2}
            title="Access any AI model"
            description="Automatic failover when calling LLMs, so your users never know a provider is down."
            icon={
              <div className="flex items-center gap-2">
                <User size={20} className="text-primary" />
                <div className="flex gap-2 h-5">
                  <div className="w-12 h-full bg-muted rounded"></div>
                  <div className="w-16 h-full bg-muted rounded"></div>
                </div>
              </div>
            }
            content={
              <div className="flex items-center justify-start gap-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#10A37F] border border-border shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1686a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4944zm-9.6607-4.1254a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1408-1.6464zM2.3408 7.8956a4.485 4.485 0 0 1 2.3655-1.9728V11.6a.7664.7664 0 0 0 .3879.6765l5.8144 3.3543-2.0201 1.1685a.0757.0757 0 0 1-.071 0l-4.8303-2.7865A4.504 4.504 0 0 1 2.3408 7.872zm16.5963 3.8558L13.1038 8.364 15.1192 7.2a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.407-.667zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 9.2297V6.8974a.0662.0662 0 0 1 .0284-.0615l4.8303-2.7866a4.4992 4.4992 0 0 1 6.6802 4.66zM8.3065 12.863l-2.02-1.1638a.0804.0804 0 0 1-.038-.0567V6.0742a4.4992 4.4992 0 0 1 7.3757-3.4537l-.142.0805L8.704 5.459a.7948.7948 0 0 0-.3927.6813zm1.0976-2.3654l2.602-1.4998 2.6069 1.4998v2.9994l-2.5974 1.4997-2.6067-1.4997Z" />
                  </svg>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-[#CC9B7A] border border-border shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M12 2L2 12L7 17L12 12L17 17L22 12L12 2Z" />
                  </svg>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-white border border-border shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                </div>
                <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-black border border-border shadow-sm">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="white">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
              </div>
            }
          />

          <StepsCard
            stepNumber={3}
            title="Trace & debug every request"
            description="Every LLM call, tool use, and handoff is traced automatically - no extra code."
            icon={
              <div className="flex items-center gap-2">
                <Activity size={20} className="text-primary" />
                <div className="flex items-center gap-1 h-5">
                  <div className="w-1.5 h-1.5 rounded-full bg-confirmative"></div>
                  <div className="w-8 h-0.5 bg-border"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-confirmative"></div>
                  <div className="w-8 h-0.5 bg-border"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-confirmative"></div>
                </div>
              </div>
            }
            content={
              <div className="flex flex-col gap-3 w-full">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div className="flex-1 h-0.5 bg-border"></div>
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                  <div className="flex-1 h-0.5 bg-border"></div>
                  <div className="w-3 h-3 rounded-full bg-primary"></div>
                </div>
                <div className="flex flex-col gap-2 text-left">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-confirmative"></div>
                    <span className="text-xs text-muted-foreground font-mono">
                      POST /chat/completions
                    </span>
                    <span className="text-xs text-confirmative font-medium">
                      200ms
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-confirmative"></div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Tool: search_database
                    </span>
                    <span className="text-xs text-confirmative font-medium">
                      45ms
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-confirmative"></div>
                    <span className="text-xs text-muted-foreground font-mono">
                      Agent handoff
                    </span>
                    <span className="text-xs text-confirmative font-medium">
                      12ms
                    </span>
                  </div>
                </div>
              </div>
            }
          />
        </div>
      </div>
    </div>
  );
}
