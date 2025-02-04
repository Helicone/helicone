import { useSupabaseClient, useUser } from "@supabase/auth-helpers-react";
import { useQuery } from "@tanstack/react-query";
import { Database } from "../../supabase/database.types";
import { useCallback, useEffect, useState } from "react";
import Cookies from "js-cookie";
import { OrgContextValue } from "@/components/layout/org/OrgContextValue";
import { ORG_ID_COOKIE_KEY } from "../../lib/constants";
import { getJawnClient } from "../../lib/clients/jawn";
import posthog from "posthog-js";
import { getHeliconeCookie } from "@/lib/cookies";
import { env } from "next-runtime-env";

const useGetOrgMembers = (orgId: string) => {
  const jawn = getJawnClient(orgId);
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["OrganizationsMembers", orgId],
    queryFn: async (query) => {
      const organizationId = query.queryKey[1];
      if (!organizationId) {
        return [];
      }
      try {
        const { data: orgMembers, error } = await jawn.GET(
          `/v1/organization/{organizationId}/members`,
          {
            params: {
              path: {
                organizationId,
              },
            },
          }
        );

        if (error) {
          console.error("Error fetching org members:", error);
          return [];
        }

        return orgMembers.data || [];
      } catch (error) {
        console.error("Error in useGetOrgMembers:", error);
        return [];
      }
    },
    refetchOnWindowFocus: false,
  });
  return {
    data: data || [],
    isLoading,
    refetch,
  };
};

const useGetOrgSlackIntegration = (orgId: string) => {
  const jawn = getJawnClient(orgId);
  const { data, isLoading } = useQuery({
    queryKey: ["OrganizationsSlackIntegration", orgId],
    queryFn: async (query) => {
      const { data, error } = await jawn.GET("/v1/integration/slack/settings");

      if (error) {
        console.error("Error fetching slack integration:", error);
        return null;
      }
      return data;
    },
  });
  return {
    data,
    isLoading,
  };
};

const useGetOrgSlackChannels = (orgId: string) => {
  const jawn = getJawnClient(orgId);
  const { data, isLoading } = useQuery({
    queryKey: ["OrganizationsSlackChannels", orgId],
    queryFn: async (query) => {
      const { data, error } = await jawn.GET("/v1/integration/slack/channels");
      if (error) {
        console.error("Error fetching slack channels:", error);
        return null;
      }
      return data.data || [];
    },
  });
  return {
    data,
    isLoading,
  };
};

const useGetOrgOwner = (orgId: string) => {
  const jawn = getJawnClient(orgId);
  const { data, isLoading } = useQuery({
    queryKey: ["OrganizationsMembersOwner", orgId],
    queryFn: async (query) => {
      const organizationId = query.queryKey[1];
      const { data: owner, error } = await jawn.GET(
        "/v1/organization/{organizationId}/owner",
        {
          params: {
            path: {
              organizationId: organizationId,
            },
          },
        }
      );

      return owner;
    },
    refetchOnWindowFocus: false,
  });
  return {
    data,
    isLoading,
  };
};

const useGetOrgMembersAndOwner = (orgId: string) => {
  const { data: members, isLoading: isMembersLoading } =
    useGetOrgMembers(orgId);
  const { data: owner, isLoading: isOwnerLoading } = useGetOrgOwner(orgId);

  const isLoading = isMembersLoading || isOwnerLoading;

  const data = {
    owner,
    members,
  };

  return {
    data,
    isLoading,
  };
};

const useGetOrg = (orgId: string) => {
  const supabaseClient = useSupabaseClient<Database>();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["OrganizationsId", orgId],
    queryFn: async (query) => {
      if (!orgId) {
        return null;
      }
      const { data, error } = await supabaseClient
        .from("organization")
        .select(`*`)
        .eq("soft_delete", false)
        .eq("id", orgId)
        .single();
      return data as Database["public"]["Tables"]["organization"]["Row"];
    },
    refetchOnWindowFocus: false,
  });

  return {
    data,
    isLoading,
    refetch,
  };
};

const useGetOrgs = () => {
  const supabaseClient = useSupabaseClient<Database>();
  const user = useUser();
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["Organizations", user?.id ?? ""],
    queryFn: async (query) => {
      if (!user?.id) {
        return [];
      }
      const { data, error } = await supabaseClient
        .from("organization")
        .select(`*`)
        .eq("soft_delete", false);
      if (error) {
        return [];
      }

      return data;
    },
    refetchOnWindowFocus: false,
  });

  data &&
    data.sort((a, b) => {
      if (a.name === b.name) {
        return a.id < b.id ? -1 : 1;
      }
      return a.name < b.name ? -1 : 1;
    });

  return {
    data,
    isLoading,
    refetch,
  };
};

const setOrgCookie = (orgId: string) => {
  Cookies.set(ORG_ID_COOKIE_KEY, orgId, { expires: 30 });
};

const useOrgsContextManager = () => {
  const user = useUser();
  const { data: orgs, refetch } = useGetOrgs();

  const [org, setOrg] = useState<NonNullable<typeof orgs>[number] | null>(null);
  const [renderKey, setRenderKey] = useState(0);
  const [isResellerOfCurrentCustomerOrg, setIsResellerOfCurrentOrg] =
    useState<boolean>(false);

  const refreshCurrentOrg = useCallback(() => {
    refetch().then((x) => {
      if (x.data && x.data.length > 0) {
        const currentOrg = x.data.find(
          (organization) => organization.id === org?.id
        );
        if (currentOrg) {
          setOrg(currentOrg);
          setOrgCookie(currentOrg.id);
          setRenderKey((key) => key + 1);
        }
      }
    });
  }, [refetch]);

  const [ensuringOneOrg, setEnsuringOneOrg] = useState(false);

  useEffect(() => {
    if ((!orgs || orgs.length === 0) && user?.id && !ensuringOneOrg) {
      setEnsuringOneOrg(true);
      const jwtToken = getHeliconeCookie().data?.jwtToken;
      const isEu = window.location.hostname.includes("eu.");
      fetch(`/api/user/${user.id}/ensure-one-org`, {
        method: "POST",
        body: JSON.stringify({
          isEu,
        }),
      }).then((res) => {
        setEnsuringOneOrg(false);
        if (res.status === 201) {
        } else if (res.status !== 200) {
          console.error("Failed to create org", res.json());
        } else {
          res.json().then((x) => {
            fetch(
              `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/evaluator`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "helicone-authorization": JSON.stringify({
                    _type: "jwt",
                    token: jwtToken,
                    orgId: x.orgId,
                  }),
                },
                body: JSON.stringify({
                  llm_template:
                    '{\n  "messages": [\n    {\n      "role": "user",\n      "content": [\n        {\n          "type": "text",\n          "text": "Please call the scorer function and use the following context to evaluate the output.\\n\\n\\n\\nHere were the inputs into the LLM:\\n### INPUT BEGIN ###\\n<helicone-prompt-input key=\\"inputs\\" />\\n### INPUT END ###\\n\\nHere was the output of the LLM:\\n### OUTPUT BEGIN ###\\n<helicone-prompt-input key=\\"outputBody\\" />\\n### OUTPUT END ###\\n\\n\\n\\n\\n"\n        }\n      ]\n    }\n  ],\n  "max_tokens": 1024,\n  "temperature": 1,\n  "model": "gpt-3.5-turbo",\n  "tools": [\n    {\n      "type": "function",\n      "function": {\n        "name": "scorer",\n        "description": "Given the inputs as shown in the system message and the output. Please call the scorer function.",\n        "parameters": {\n          "type": "object",\n          "properties": {\n            "PackerQuality": {\n              "description": "You are an expert travel consultant who specializes in evaluating packing list recommendations. Given the travel context and the AI\'s generated packing list, score how well the packing list serves the traveler\'s needs on a scale of 1-100.\\n\\nScoring Rubric:\\n- Weather Appropriateness (25 points)\\n  • Items match destination climate\\n  • Seasonal considerations included\\n  • Layering options if needed\\n  • Weather protection items\\n\\n- Activity Coverage (25 points)\\n  • All planned activities accounted for\\n  • Appropriate gear/clothing for each activity\\n  • Safety equipment where necessary\\n  • Specialized items included\\n\\n- Essential Basics (25 points)\\n  • Core travel items covered\\n  • Toiletries completeness\\n  • Documents and money items\\n  • Electronics and chargers\\n\\n- Practicality (25 points)\\n  • Appropriate for trip duration\\n  • Not overpacked/redundant\\n  • Consideration for luggage limitations\\n  • Items are travel-friendly\\n\\nConsider both inclusion of necessary items and exclusion of unnecessary ones in your scoring. Deduct points for irrelevant items or missed essentials.",\n              "type": "number",\n              "minimum": 1,\n              "maximum": 100\n            }\n          },\n          "required": [\n            "PackerQuality"\n          ]\n        }\n      }\n    }\n  ]\n}',
                  scoring_type: "LLM-RANGE",
                  name: "PackerQuality",
                }),
              }
            ).then(async (response) => {
              const evaluator = await response.json();
              if (evaluator.data?.id) {
                await fetch(
                  `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/evaluator/${evaluator.data.id}/onlineEvaluators`,
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                      "helicone-authorization": JSON.stringify({
                        _type: "jwt",
                        token: jwtToken,
                        orgId: x.orgId,
                      }),
                    },
                    body: JSON.stringify({
                      config: {
                        sampleRate: 100,
                        propertyFilters: [
                          {
                            key: "Helicone-Prompt-Id",
                            value: "generate-packing-list",
                          },
                        ],
                      },
                    }),
                  }
                );
              }
            });

            fetch(
              `${process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE}/v1/organization/setup-demo`,
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "helicone-authorization": JSON.stringify({
                    _type: "jwt",
                    token: jwtToken,
                    orgId: x.orgId,
                  }),
                },
              }
            );
            refreshCurrentOrg();
          });
        }
      });
    }
  }, [orgs, user?.id, refreshCurrentOrg]);

  useEffect(() => {
    if (user) {
      posthog.identify(
        user.id,
        {
          name: user.user_metadata?.name,
        },
        {
          email: user.email,
        }
      );
    }

    if (org) {
      posthog.group("organization", org.id, {
        name: org.name || "",
        tier: org.tier || "",
        stripe_customer_id: org.stripe_customer_id || "",
        organization_type: org.organization_type || "",
        date_joined: org.created_at || "",
      });

      if (user && env("NEXT_PUBLIC_IS_ON_PREM") !== "true") {
        window.pylon = {
          chat_settings: {
            app_id: "f766dfd3-28f8-40a8-872f-351274cbd306",
            email: user.email,
            name: user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
          },
        };

        if (window.Pylon) {
          window.Pylon("setNewIssueCustomFields", {
            organization_id: org.id,
            organization_name: org.name,
            organization_tier: org.tier,
          });
        }
      }
    }
  }, [user, org?.id, org?.name, org?.tier]);

  useEffect(() => {
    if (orgs && orgs.length > 0) {
      const orgIdFromCookie = Cookies.get(ORG_ID_COOKIE_KEY);
      const orgFromCookie = orgs.find((org) => org.id === orgIdFromCookie);
      if (!orgFromCookie) {
        Cookies.set(ORG_ID_COOKIE_KEY, orgs[0].id, { expires: 30 });
      }
      setOrg(orgFromCookie || orgs[0]);
    }
  }, [orgs]);

  useEffect(() => {
    setIsResellerOfCurrentOrg(
      !!(
        org?.organization_type === "customer" &&
        org.reseller_id &&
        orgs?.find((x) => x.id === org.reseller_id)
      )
    );
  }, [org?.organization_type, org?.reseller_id, orgs]);

  let orgContextValue: OrgContextValue | null = null;

  orgContextValue = {
    allOrgs: orgs ?? [],
    currentOrg: org ?? undefined,
    isResellerOfCurrentCustomerOrg,
    refreshCurrentOrg,
    setCurrentOrg: (orgId) => {
      refetch().then((data) => {
        const org = data?.data?.find((org) => org.id === orgId);
        if (org) {
          setOrg(org);
          setOrgCookie(org.id);
          setRenderKey((key) => key + 1);
        }
      });
    },
    renderKey,
    refetchOrgs: refetch,
  };

  return orgContextValue;
};

export {
  useGetOrgMembers,
  useGetOrgOwner,
  useGetOrgs,
  useOrgsContextManager,
  setOrgCookie,
  useGetOrg,
  useGetOrgMembersAndOwner,
  useGetOrgSlackIntegration,
  useGetOrgSlackChannels,
};
