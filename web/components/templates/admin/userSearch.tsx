import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/router";
import { useInfiniteQuery } from "@tanstack/react-query";
import { Search, Loader2, ChevronDown, ChevronUp, Copy } from "lucide-react";
import { getJawnClient } from "@/lib/clients/jawn";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { H1, Muted, P, Small } from "@/components/ui/typography";
import useNotification from "@/components/shared/notification/useNotification";

type UserSearchResult = {
  id: string;
  email: string;
  name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  is_admin: boolean;
  organizations: { id: string; name: string | null; role: string | null }[];
};

type UserSearchResponse = {
  users: UserSearchResult[];
  total: number;
  hasMore: boolean;
};

const LIMIT = 50;

const formatDateTime = (value: string | null) => {
  if (!value) {
    return "Never";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown";
  }
  return date.toLocaleString();
};

const UserSearch = () => {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const { setNotification } = useNotification();

  useEffect(() => {
    if (router.query.q && typeof router.query.q === "string") {
      setSearchQuery(router.query.q);
    }
  }, [router.query.q]);

  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  useEffect(() => {
    const trimmedQuery = debouncedSearchQuery.trim();
    if (trimmedQuery.length > 0) {
      router.replace(
        { pathname: router.pathname, query: { q: trimmedQuery } },
        undefined,
        { shallow: true },
      );
    } else if (router.query.q) {
      router.replace({ pathname: router.pathname }, undefined, {
        shallow: true,
      });
    }
  }, [debouncedSearchQuery, router]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery<UserSearchResponse>({
    queryKey: ["userSearch", debouncedSearchQuery],
    queryFn: async ({ pageParam = 0 }) => {
      const jawn = getJawnClient();
      const { data, error } = await jawn.POST("/v1/admin/user-search", {
        body: {
          query: debouncedSearchQuery,
          limit: LIMIT,
          offset: pageParam as number,
        },
      });

      if (error) {
        throw error;
      }

      return data;
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage?.hasMore) {
        return undefined;
      }
      const loadedUsers = allPages.reduce(
        (sum, page) => sum + page.users.length,
        0,
      );
      return loadedUsers;
    },
    enabled: debouncedSearchQuery.trim().length > 0,
  });

  const users = useMemo(
    () => data?.pages.flatMap((page) => page.users) ?? [],
    [data],
  );

  useEffect(() => {
    if (expandedUserId && !users.some((user) => user.id === expandedUserId)) {
      setExpandedUserId(null);
    }
  }, [expandedUserId, users]);

  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const current = observerTarget.current;
    if (current) {
      observer.observe(current);
    }

    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleRetry = async () => {
    await refetch();
  };

  const handleCopy = (value: string, message: string) => {
    navigator.clipboard.writeText(value);
    setNotification(message, "success");
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <H1>User Search</H1>
        <P className="text-sm text-muted-foreground">
          Find users by email or user ID. Click a row to view organization
          membership details.
        </P>
      </div>

      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 shadow-sm">
        <div className="relative flex items-center">
          <Search className="absolute left-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search by email or user ID"
            className="pl-10"
            aria-label="Search users by email"
          />
        </div>
        <Muted className="text-xs">
          Requires an exact or partial email match. Results load automatically
          as you scroll.
        </Muted>
      </div>

      {error ? (
        <div className="flex flex-col gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
          <P className="text-sm font-medium text-destructive">
            Unable to load users.
          </P>
          <Button
            variant="outline"
            size="sm"
            className="w-fit"
            onClick={handleRetry}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {debouncedSearchQuery.trim().length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-10 text-center">
          <Search className="h-10 w-10 text-muted-foreground" />
          <P className="text-sm text-muted-foreground">
            Start typing an email address to look up a user.
          </P>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-lg border border-border p-6">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              <P className="text-sm text-muted-foreground">Searching users…</P>
            </div>
          ) : users.length === 0 ? (
            <div className="flex items-center justify-center rounded-lg border border-dashed border-border p-6">
              <P className="text-sm text-muted-foreground">
                No users found for “{debouncedSearchQuery.trim()}”.
              </P>
            </div>
          ) : (
            <div className="overflow-hidden rounded-lg border border-border">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr className="text-left text-xs uppercase text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Email</th>
                    <th className="px-4 py-3 font-medium">Name</th>
                    <th className="px-4 py-3 font-medium">Total Orgs</th>
                    <th className="px-4 py-3 font-medium">Owner Roles</th>
                    <th className="px-4 py-3 font-medium">Created</th>
                    <th className="px-4 py-3 font-medium">Last Sign In</th>
                    <th className="px-4 py-3 text-right font-medium">
                      Details
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-background text-sm">
                  {users.map((user) => {
                    const isExpanded = expandedUserId === user.id;
                    const organizationCount = user.organizations.length;
                    const ownerCount = user.organizations.filter(
                      (org) => org.role?.toLowerCase() === "owner",
                    ).length;

                    return (
                      <React.Fragment key={user.id}>
                        <tr
                          className="cursor-pointer transition hover:bg-muted/30"
                          onClick={() =>
                            setExpandedUserId(isExpanded ? null : user.id)
                          }
                        >
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium">
                                {user.email}
                              </span>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleCopy(user.email, "Email copied");
                                }}
                              >
                                <Copy className="h-3 w-3" />
                              </Button>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span>{user.name ?? "Unknown"}</span>
                              {user.is_admin ? (
                                <Badge
                                  variant="secondary"
                                  className="border border-border/50"
                                >
                                  Admin
                                </Badge>
                              ) : null}
                            </div>
                          </td>
                          <td className="px-4 py-3">{organizationCount}</td>
                          <td className="px-4 py-3">{ownerCount}</td>
                          <td className="px-4 py-3">
                            {formatDateTime(user.created_at)}
                          </td>
                          <td className="px-4 py-3">
                            {formatDateTime(user.last_sign_in_at)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="flex items-center gap-1"
                              onClick={(event) => {
                                event.stopPropagation();
                                setExpandedUserId(isExpanded ? null : user.id);
                              }}
                            >
                              {isExpanded ? (
                                <>
                                  Hide
                                  <ChevronUp className="h-4 w-4" />
                                </>
                              ) : (
                                <>
                                  View
                                  <ChevronDown className="h-4 w-4" />
                                </>
                              )}
                            </Button>
                          </td>
                        </tr>
                        {isExpanded ? (
                          <tr>
                            <td colSpan={7} className="bg-muted/20 px-4 py-5">
                              <div className="grid gap-6 lg:grid-cols-2">
                                <div className="flex flex-col gap-4">
                                  <div className="flex flex-col gap-2">
                                    <Small className="text-xs font-semibold text-muted-foreground">
                                      User
                                    </Small>
                                    <div className="flex items-center justify-between gap-3 rounded border border-border bg-card p-3">
                                      <div className="flex flex-col gap-1">
                                        <span className="text-xs uppercase text-muted-foreground">
                                          User ID
                                        </span>
                                        <span className="font-mono break-all text-xs">
                                          {user.id}
                                        </span>
                                      </div>
                                      <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={(event) => {
                                          event.stopPropagation();
                                          handleCopy(user.id, "User ID copied");
                                        }}
                                      >
                                        Copy
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                                <div className="flex flex-col gap-2">
                                  <Small className="text-xs font-semibold text-muted-foreground">
                                    Organizations
                                  </Small>
                                  {user.organizations.length === 0 ? (
                                    <Muted className="text-xs">None</Muted>
                                  ) : (
                                    <div className="flex flex-col gap-2">
                                      {user.organizations.map((org) => {
                                        const orgId = org.id ?? null;
                                        const linkProps = orgId
                                          ? {
                                              href: `/admin/org-search?q=${encodeURIComponent(orgId)}`,
                                              target: "_blank",
                                              rel: "noopener noreferrer",
                                            }
                                          : {};

                                        return (
                                          <a
                                            key={`${org.id}-${org.role}`}
                                            {...linkProps}
                                            className="flex items-center justify-between gap-2 rounded border border-border bg-background p-2 text-xs text-blue-600 hover:bg-muted/30 hover:underline dark:text-blue-400"
                                            onClick={(event) => {
                                              if (!orgId) {
                                                event.preventDefault();
                                              }
                                              event.stopPropagation();
                                            }}
                                          >
                                            <div className="flex flex-col">
                                              <span className="truncate">
                                                {org.name || "Unnamed org"}
                                              </span>
                                              <span className="text-[11px] uppercase text-muted-foreground">
                                                Role: {org.role || "member"}
                                              </span>
                                            </div>
                                            <span className="font-mono text-[11px] text-muted-foreground">
                                              {orgId
                                                ? `${orgId.slice(0, 8)}…`
                                                : "—"}
                                            </span>
                                          </a>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>
                          </tr>
                        ) : null}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div
        ref={observerTarget}
        className="flex w-full items-center justify-center py-4"
      >
        {isFetchingNextPage ? (
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        ) : null}
      </div>
    </div>
  );
};

export default UserSearch;
