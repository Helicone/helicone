import { buildDynamicUpdateQuery, dbExecute } from "@/lib/api/db/dbExecute";
import {
  getEvaluatorUsage,
  getExperimentUsage,
} from "@/lib/api/stripe/llmUsage";
import { PosthogClient } from "@/lib/clients/posthogClient";
import { getHeliconeAuthClient } from "@/packages/common/auth/server/AuthClientFactory";
import { costOf } from "@helicone-package/cost";
import { OnboardingState } from "@/services/hooks/useOrgOnboarding";
import { WebClient } from "@slack/web-api";
import generateApiKey from "generate-api-key";
import { buffer } from "micro";
import { NextApiRequest, NextApiResponse } from "next";
import Stripe from "stripe";
import { hashAuth } from "../../../../lib/hashClient";
const POSTHOG_EVENT_API = "https://us.i.posthog.com/i/v0/e/";

async function getUserIdFromEmail(email: string): Promise<string | null> {
  try {
    const query = `
      SELECT id 
      FROM auth.users 
      WHERE email = $1
      LIMIT 1
    `;

    const result = await dbExecute<{ id: string }>(query, [email]);

    if (result.data && Array.isArray(result.data) && result.data.length > 0) {
      return result.data[0].id;
    }

    console.error(`No user found with email: ${email}`);
    return null;
  } catch (error) {
    console.error(`Error getting userId from email: ${email}`, error);
    return null;
  }
}

const ADDON_PRICES: Record<string, keyof Addons> = {
  [process.env.PRICE_PROD_ALERTS_ID!]: "alerts",
  [process.env.PRICE_PROD_PROMPTS_ID!]: "prompts",
  [process.env.PRICE_PROD_EXPERIMENTS_FLAT_ID!]: "experiments",
  [process.env.PRICE_PROD_EVALS_ID!]: "evals",
};

type Addons = {
  alerts?: boolean;
  prompts?: boolean;
  experiments?: boolean;
  evals?: boolean;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

async function sendSubscriptionEvent(
  eventType:
    | "subscription_created"
    | "subscription_canceled"
    | "subscription_deleted",
  subscription: Stripe.Subscription,
  additionalProperties: Record<string, any> = {}
) {
  try {
    const orgId = subscription.metadata?.orgId;
    if (!orgId) {
      console.log(
        `No orgId found in subscription metadata, skipping PostHog event`
      );
      return;
    }

    const customerId =
      typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer.id;

    const customer = await stripe.customers.retrieve(customerId);

    if (
      !customer ||
      customer.deleted ||
      !("email" in customer) ||
      !customer.email
    ) {
      console.log(`No valid customer email found, skipping PostHog event`);
      return;
    }

    let orgData = undefined;
    if (additionalProperties.includeOrgData) {
      const { data } = await dbExecute<{ name: string; owner: string }>(
        `select name, owner from organization where id = $1`,
        [orgId]
      );
      orgData = data?.[0];
      delete additionalProperties.includeOrgData;
    }

    const userId = await getUserIdFromEmail(customer.email);
    if (!userId) {
      console.error(
        `Failed to get userId for email ${customer.email}, cannot send PostHog event`
      );
      return;
    }

    const tier = subscription.metadata?.tier || "unknown";
    const baseProperties: Record<string, any> = {
      subscription_id: subscription.id,
      subscription_item_id: subscription.items?.data[0]?.id,
      tier,
      customer_id: customerId,
      email: customer.email,
      date_joined: new Date().toISOString(),
      owner_id: orgData?.owner,
    };

    if (eventType === "subscription_canceled") {
      baseProperties.cancel_reason = subscription.cancel_at_period_end
        ? "end_of_period"
        : "immediate";
    }

    const analytics = PosthogClient.getInstance();
    await analytics.captureEvent(
      eventType,
      {
        ...baseProperties,
        ...additionalProperties,
      },
      userId,
      orgId
    );

    console.log(
      `PostHog: Sent ${eventType} event for org ${orgId} (userId: ${userId}, tier: ${tier})`
    );
  } catch (error) {
    console.error(`Failed to send PostHog event for ${eventType}:`, error);
  }
}

async function sendSubscriptionCanceledEvent(
  subscription: Stripe.Subscription
) {
  const isCanceling = subscription.cancel_at_period_end === true;
  const isSubscriptionActive = subscription.status === "active";
  const isTrialCanceled = subscription.status === "trialing" && isCanceling;
  const isImmediatelyCanceled = subscription.status === "canceled";

  if (
    (isCanceling && isSubscriptionActive) ||
    isTrialCanceled ||
    isImmediatelyCanceled
  ) {
    try {
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer.id;

      const customer = await stripe.customers.retrieve(customerId);

      if (
        customer &&
        !customer.deleted &&
        "email" in customer &&
        customer.email
      ) {
        const requestBody = JSON.stringify({
          email: customer.email,
          eventName: "subscription_canceled",
        });

        await fetch("https://app.loops.so/api/v1/events/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${process.env.LOOPS_API_KEY}`,
          },
          body: requestBody,
        });

        await sendSubscriptionEvent("subscription_canceled", subscription);
      } else {
        console.log(
          `No valid customer email found. Customer object:`,
          JSON.stringify(customer)
        );
      }
    } catch (loopsError) {
      console.error("Failed to send Loops event:", loopsError);
    }
  } else {
    console.log(
      `Subscription ${subscription.id} does not meet criteria for sending cancellation email`
    );
  }
}

const PricingVersionOld = {
  async handleCreate(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    // subscription.metadata?.["helcionePricingVersion"] !==
    const subscriptionId = subscription.id;
    const subscriptionItemId = subscription?.items.data[0].id;
    const orgId = subscription.metadata?.orgId;

    const { data: org, error: orgError } = await dbExecute(
      `UPDATE organization SET subscription_status = 'active', stripe_subscription_id = $1, stripe_subscription_item_id = $2, tier = 'growth', stripe_metadata = $3 WHERE id = $4`,
      [subscriptionId, subscriptionItemId, {}, orgId]
    );

    if (orgError) {
      console.error("Failed to update organization:", JSON.stringify(orgError));
    } else {
      console.log("Organization updated successfully: ", JSON.stringify(org));
    }
  },

  async handleUpdate(event: Stripe.Event) {
    const subscriptionUpdated = event.data.object as Stripe.Subscription;

    const isSubscriptionActive = subscriptionUpdated.status === "active";

    let growthPlanItem = null;
    let proPlanItem = null;
    for (const item of subscriptionUpdated?.items?.data) {
      if (
        item.plan.id === process.env.STRIPE_GROWTH_PRICE_ID &&
        item.plan.usage_type === "metered"
      ) {
        growthPlanItem = item;
        break;
      } else if (
        item.plan.id === process.env.STRIPE_PRICE_ID &&
        item.plan.usage_type !== "metered"
      ) {
        proPlanItem = item;
        break;
      }
    }

    type UpdateFields = {
      subscription_status?: "active" | "inactive";
      tier?: "growth" | "pro";
      stripe_subscription_item_id?: string;
    };

    let updateFields: UpdateFields = {
      subscription_status: isSubscriptionActive ? "active" : "inactive",
    };

    if (isSubscriptionActive && growthPlanItem && !proPlanItem) {
      updateFields.tier = "growth";
      updateFields.stripe_subscription_item_id = growthPlanItem.id;
    } else if (isSubscriptionActive && proPlanItem && !growthPlanItem) {
      updateFields.tier = "pro";
    }

    // Use the helper function to build the dynamic query
    const { query, params } = buildDynamicUpdateQuery({
      from: "organization",
      set: updateFields,
      where: {
        field: "stripe_customer_id",
        equals: subscriptionUpdated.customer,
      },
    });

    // Only proceed with update if there are fields to update
    if (params.length > 1) {
      // At least one update field + where condition
      const { data: org, error: orgError } = await dbExecute(query, params);

      if (orgError) {
        console.error(
          "Failed to update organization:",
          JSON.stringify(orgError)
        );
      } else {
        console.log("Organization updated successfully: ", JSON.stringify(org));
      }
    } else {
      console.log(
        "No fields to update for organization with customer ID:",
        subscriptionUpdated.customer
      );
    }

    await sendSubscriptionCanceledEvent(subscriptionUpdated);
  },

  async handleDelete(event: Stripe.Event) {
    // Subscription has been deleted, either due to non-payment or being manually canceled.
    const subscriptionDeleted = event.data.object as Stripe.Subscription;
    await dbExecute(
      `UPDATE organization SET subscription_status = 'inactive', tier = 'free', stripe_metadata = $1 WHERE stripe_subscription_id = $2`,
      [{ addons: {} }, subscriptionDeleted.id]
    );
  },

  async handleCheckoutSessionCompleted(event: Stripe.Event) {
    const checkoutCompleted = event.data.object as Stripe.Checkout.Session;
    const orgId = checkoutCompleted.metadata?.orgId;
    const tier = checkoutCompleted.metadata?.tier;

    const { data: org, error: orgError } = await dbExecute(
      `UPDATE organization SET subscription_status = 'active', stripe_subscription_id = $1, tier = $2 WHERE id = $3`,
      [checkoutCompleted.subscription?.toString(), tier, orgId]
    );

    if (orgError) {
      console.error("Failed to update organization:", JSON.stringify(orgError));
    } else {
      console.log("Organization updated successfully: ", JSON.stringify(org));
    }
  },
};

// TempAPIKey class for managing temporary API keys with automatic cleanup
class TempAPIKey {
  constructor(private apiKey: string, private keyId: number) {}

  // Use the key for an operation and ensure cleanup afterward
  async use<T>(callback: (apiKey: string) => Promise<T>): Promise<T> {
    try {
      return await callback(this.apiKey);
    } finally {
      await this.cleanup();
    }
  }

  // Clean up the key by soft-deleting it
  private async cleanup() {
    try {
      await dbExecute(
        `UPDATE helicone_api_keys SET soft_delete = true WHERE id = $1`,
        [this.keyId]
      );
    } catch (error) {
      console.error("Failed to cleanup temporary API key:", error);
    }
  }
}

// Generate a temporary API key for server-to-server communication
async function generateTempAPIKey(
  organizationId: string,
  keyName: string,
  keyPermissions: "rw" | "r" | "w"
): Promise<TempAPIKey> {
  const apiKey = `sk-helicone-${generateApiKey({
    method: "base32",
    dashes: true,
  }).toString()}`.toLowerCase();

  // Define a type for the organization data
  type OrgData = {
    owner: string;
  };

  const { data: orgData, error: orgError } = await dbExecute<OrgData>(
    `SELECT owner FROM organization WHERE id = $1 LIMIT 1`,
    [organizationId]
  );

  if (orgError || !orgData || orgData.length === 0) {
    throw new Error(`Failed to find organization: ${orgError}`);
  }

  const owner = orgData[0].owner;

  const { data: keyData, error: keyError } = await dbExecute<{ id: number }>(
    `INSERT INTO helicone_api_keys (api_key_hash, user_id, api_key_name, organization_id, key_permissions, temp_key) 
     VALUES ($1, $2, $3, $4, $5, $6) 
     RETURNING id`,
    [
      await hashAuth(apiKey),
      owner ?? "",
      keyName,
      organizationId,
      keyPermissions,
      true,
    ]
  );

  if (keyError || !keyData || keyData.length === 0) {
    throw new Error("Failed to create API key");
  }

  return new TempAPIKey(apiKey, keyData[0].id);
}

// Helper function to get the Jawn service URL, replacing localhost with 127.0.0.1 in serverless environments
function getJawnServiceUrl(): string {
  // Get the URL from environment variable
  const jawnServiceUrl =
    process.env.NEXT_PUBLIC_HELICONE_JAWN_SERVICE || "http://localhost:8585";

  // In serverless environments (Next.js API routes), replace localhost with 127.0.0.1
  // This is needed because localhost doesn't resolve correctly in serverless environments
  if (typeof window === "undefined" && jawnServiceUrl.includes("localhost")) {
    return jawnServiceUrl.replace("localhost", "127.0.0.1");
  }

  return jawnServiceUrl;
}

async function inviteOnboardingMembers(orgId: string | undefined) {
  if (!orgId) {
    return;
  }

  // Define type for the result
  type OnboardingData = {
    onboarding_status: OnboardingState | null;
  };

  const { data: orgDataArr, error: orgDataError } =
    await dbExecute<OnboardingData>(
      `SELECT onboarding_status FROM organization WHERE id = $1 LIMIT 1`,
      [orgId]
    );

  if (orgDataError || !orgDataArr || orgDataArr.length === 0) {
    console.log("Failed to fetch onboarding status:", orgDataError);
    return;
  }

  const orgData = orgDataArr[0];
  const onboardingStatus =
    orgData?.onboarding_status as unknown as OnboardingState | null;

  if (
    !onboardingStatus ||
    !Array.isArray(onboardingStatus.members) ||
    onboardingStatus.members.length === 0
  ) {
    return;
  }

  // Get the Jawn service URL (with localhost replaced by 127.0.0.1 if needed)
  const jawnServiceUrl = getJawnServiceUrl();

  // Generate a temporary API key and use it with automatic cleanup
  const tempKey = await generateTempAPIKey(
    orgId,
    "Stripe Webhook Server Key",
    "rw"
  );

  // Use the key with automatic cleanup
  await tempKey.use(async (serverApiKey) => {
    for (const member of onboardingStatus.members) {
      if (!member.email) {
        continue;
      }
      try {
        const response = await fetch(
          `${jawnServiceUrl}/v1/organization/${orgId}/add_member`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${serverApiKey}`,
            },
            body: JSON.stringify({
              email: member.email,
            }),
          }
        );

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        await response.json();
      } catch (error) {
        console.error(`Failed to invite member ${member.email}:`, error);
      }
    }
  });
}

async function createSlackChannelAndInviteMembers(
  orgId: string | undefined,
  orgName: string | undefined
) {
  if (!orgId || !orgName || !process.env.SLACK_BOT_TOKEN) {
    console.log("Missing organization ID, name, or Slack token");
    return;
  }

  const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

  const channelName = formatChannelName(orgName, orgId);
  console.log(`Creating Slack channel: ${channelName}`);

  const createChannelResponse = await slackClient.conversations.create({
    name: channelName,
    is_private: false,
  });

  const channelId = createChannelResponse.channel?.id as string;

  // Have the bot join the channel
  await slackClient.conversations.join({
    channel: channelId,
  });

  // Get the organization members' emails for welcome message
  type OrgMember = {
    member: string;
  };

  const { data: orgMembers, error: orgMembersError } =
    await dbExecute<OrgMember>(
      `SELECT member FROM organization_member WHERE organization = $1`,
      [orgId]
    );

  if (orgMembersError) {
    console.log("Failed to fetch organization members:", orgMembersError);
  }

  const emails = await Promise.all(
    orgMembers?.map((member) => getUserEmail(member.member)) || []
  ).then((emails) => emails.filter((email) => email !== null) as string[]);

  // Invite all workspace members
  console.log("Inviting all workspace members to the channel");
  const allMembers = await slackClient.users.list({
    limit: 200, // Fetch up to 200 users at once
  });

  if (allMembers.ok && allMembers.members && allMembers.members.length > 0) {
    // Filter out bots, deleted users, and restricted users
    const realUsers = allMembers.members.filter(
      (member) => !member.is_bot && !member.deleted && !member.is_restricted
    );

    if (realUsers.length > 0) {
      console.log(`Found ${realUsers.length} real workspace members`);

      // Collect all user IDs and invite them
      const userIds = realUsers
        .filter((user) => user.id)
        .map((user) => user.id)
        .join(",");

      if (userIds) {
        await slackClient.conversations.invite({
          channel: channelId,
          users: userIds,
        });
        console.log(
          `Invited ${realUsers.length} workspace members to the channel`
        );
      }
    }
  }

  // Get support team user group ID
  const userGroupId = "S08JS8UK211"; // Team support group ID
  console.log(
    `Associating channel ${channelId} with support group ${userGroupId}`
  );

  // Associate the channel with the Team user group
  const userGroupsListResponse = await slackClient.usergroups.list({
    include_users: false,
  });

  const targetGroup = userGroupsListResponse.usergroups?.find(
    (group) => group.id === userGroupId
  );

  if (targetGroup) {
    // Get existing channels from the prefs
    const existingChannels = targetGroup.prefs?.channels || [];

    // Add the new channel to the list if not already present
    if (!existingChannels.includes(channelId)) {
      existingChannels.push(channelId);
    }

    // Update the user group with the new list of channels
    await slackClient.usergroups.update({
      usergroup: userGroupId,
      channels: existingChannels.join(","), // Slack expects a comma-separated string
    });
    console.log(`Successfully associated channel with support group`);
  }

  // Post welcome message to the channel with email list
  // Format a list of emails to display
  const emailList =
    emails.length > 0
      ? emails.map((email) => `• ${email}`).join("\n")
      : "• No member emails found";

  // Post welcome message to the channel with email list
  await slackClient.chat.postMessage({
    channel: channelId,
    text:
      `:wave: Welcome to your dedicated Helicone support channel, *${orgName}*!\n\n` +
      `Our team is here to help you get the most out of Helicone. Feel free to ask any questions or request assistance here.\n\n` +
      `Organization members to invite to Slack:\n${emailList}\n\n` +
      `(These users will need to be manually invited to the Slack workspace)`,
  });

  console.log(
    `Successfully created Slack channel and added team members for ${orgName}`
  );
}

function formatChannelName(
  organizationName: string,
  organizationId?: string
): string {
  // Start with the team prefix
  let name = "team-";

  // Add organization name in lowercase
  name += organizationName.toLowerCase();

  // Replace spaces and special chars with hyphens
  name = name.replace(/[^a-z0-9_-]/g, "-");

  // Remove consecutive hyphens
  name = name.replace(/-+/g, "-");

  // Remove trailing hyphens (but keep the leading "team-" prefix)
  name = name.replace(/-+$/g, "");

  // Add org ID suffix for uniqueness if provided
  if (organizationId) {
    const shortId = organizationId.substring(0, 6);
    name = `${name.substring(0, 70)}-${shortId}`;
  }

  // Enforce max length (Slack limit is 80, but we're being cautious)
  return name.substring(0, 80);
}

async function getUserEmail(
  userId: string | undefined
): Promise<string | null> {
  if (!userId) return null;

  try {
    const user = await getHeliconeAuthClient().getUserById(userId);
    return user.data?.email || null;
  } catch (error) {
    console.error("Error fetching owner email:", error);
    return null;
  }
}

// Fix the TeamVersion20250130 implementation
const TeamVersion20250130 = {
  async handleCreate(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId = subscription.id;
    const subscriptionItemId = subscription?.items.data[0].id;
    const orgId = subscription.metadata?.orgId;

    // Get the existing subscription from the organization
    type OrgSubscriptionData = {
      stripe_subscription_id: string | null;
      name: string | null;
      owner: string | null;
    };

    const { data: orgDataArray, error: orgDataError } =
      await dbExecute<OrgSubscriptionData>(
        `SELECT stripe_subscription_id, name, owner FROM organization WHERE id = $1 LIMIT 1`,
        [orgId || ""]
      );

    if (orgDataError) {
      console.error("Failed to fetch organization data:", orgDataError);
    }

    const orgData =
      orgDataArray && orgDataArray.length > 0 ? orgDataArray[0] : null;

    // Cancel old subscription if it exists
    if (
      orgData &&
      orgData.stripe_subscription_id &&
      typeof orgData.stripe_subscription_id === "string"
    ) {
      try {
        console.log("Cancelling old subscription");
        await stripe.subscriptions.cancel(orgData.stripe_subscription_id, {
          invoice_now: true,
          prorate: true,
        });
      } catch (e) {
        console.error("Error canceling old subscription:", e);
      }
    }

    // Update to new subscription
    const { data: updateData, error: updateError } = await dbExecute(
      `UPDATE organization 
       SET subscription_status = 'active', 
           stripe_subscription_id = $1, 
           stripe_subscription_item_id = $2, 
           tier = 'team-20250130', 
           stripe_metadata = $3
       WHERE id = $4`,
      [subscriptionId, subscriptionItemId, { addons: {} }, orgId || ""]
    );

    if (updateError) {
      console.error("Failed to update organization:", updateError);
    }

    // Invite members after org is updated
    await inviteOnboardingMembers(orgId);

    // Create Slack channel and invite team members
    if (orgData?.name) {
      await createSlackChannelAndInviteMembers(orgId, orgData.name);
    }

    // Send PostHog event
    await sendSubscriptionEvent("subscription_created", subscription, {
      includeOrgData: true,
    });
  },

  handleUpdate: async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    await sendSubscriptionCanceledEvent(subscription);
  },
  handleCheckoutSessionCompleted: async (event: Stripe.Event) => {
    // We don't need to do anything here because the subscription is already active
    // All update states are handled in the jawn StripeManager
    return;
  },
  handleDelete: PricingVersionOld.handleDelete,
};

const PricingVersion20240913 = {
  async handleCreate(event: Stripe.Event) {
    const subscription = event.data.object as Stripe.Subscription;
    const subscriptionId = subscription.id;
    const subscriptionItemId = subscription?.items.data[0].id;
    const orgId = subscription.metadata?.orgId;
    const addons: Addons = {};

    subscription.items.data.forEach((item) => {
      const addonKey = ADDON_PRICES[item.price.id];
      if (addonKey) {
        addons[addonKey] =
          item.quantity !== undefined ? item.quantity > 0 : false;
      }
    });

    const { data: updateData, error: updateError } = await dbExecute(
      `UPDATE organization 
       SET subscription_status = 'active', 
           stripe_subscription_id = $1, 
           stripe_subscription_item_id = $2, 
           tier = 'pro-20250202', 
           stripe_metadata = $3
       WHERE id = $4`,
      [subscriptionId, subscriptionItemId, { addons: addons }, orgId || ""]
    );

    if (updateError) {
      console.error("Failed to update organization:", updateError);
    }

    // Invite members after org is updated
    await inviteOnboardingMembers(orgId);

    // Send PostHog event
    await sendSubscriptionEvent("subscription_created", subscription, {
      includeOrgData: true,
      addons: JSON.stringify(addons),
    });
  },

  handleUpdate: async (event: Stripe.Event) => {
    const subscription = event.data.object as Stripe.Subscription;
    await sendSubscriptionCanceledEvent(subscription);
  },
  handleCheckoutSessionCompleted: async (event: Stripe.Event) => {
    // We don't need to do anything here because the subscription is already active
    // All update states are handled in the jawn StripeManager
    return;
  },
  handleDelete: PricingVersionOld.handleDelete,
};

const InvoiceHandlers = {
  async handleInvoiceCreated(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;

    try {
      if (invoice.status === "draft") {
        const subscriptionMetadata = invoice.subscription_details?.metadata;
        const orgId = subscriptionMetadata?.orgId;
        if (!orgId) {
          console.log("No orgId found, skipping invoice item creation");
          return;
        }

        const customerID =
          typeof invoice.customer === "string"
            ? invoice.customer
            : invoice.customer?.id;

        if (!customerID) {
          console.log("No customerID found, skipping invoice item creation");
          return;
        }

        const subscription = await stripe.subscriptions.retrieve(
          invoice.subscription as string
        );

        const subscriptionStartDate = new Date(
          subscription.current_period_start * 1000
        );
        const subscriptionEndDate = new Date(
          subscription.current_period_end * 1000
        );

        const experimentUsage = await getExperimentUsage(
          orgId,
          subscriptionStartDate,
          subscriptionEndDate
        );

        if (experimentUsage.error || !experimentUsage.data) {
          console.error(
            "Error getting experiment usage:",
            experimentUsage.error
          );
          return;
        }

        const evaluatorUsage = await getEvaluatorUsage(
          orgId,
          subscriptionStartDate,
          subscriptionEndDate
        );

        if (evaluatorUsage.error || !evaluatorUsage.data) {
          console.error("Error getting evaluator usage:", evaluatorUsage.error);
          return;
        }

        if (experimentUsage.data.length !== 0) {
          for (const usage of experimentUsage.data) {
            const totalCost = costOf({
              model: usage.model,
              provider: usage.provider.toUpperCase(),
            });

            if (!totalCost) {
              console.error("No cost found for", usage.model, usage.provider);
              continue;
            }

            await stripe.invoiceItems.create({
              customer: customerID,
              invoice: invoice.id,
              currency: "usd",
              amount: Math.ceil(
                (totalCost.completion_token * usage.completion_tokens +
                  totalCost.prompt_token * usage.prompt_tokens) *
                  100
              ),
              description: `Experiment: ${usage.provider}/${
                usage.model
              }: ${usage.completion_tokens.toLocaleString()} completion tokens, ${usage.prompt_tokens.toLocaleString()} prompt tokens, at $${+(
                totalCost.completion_token * 1000
              ).toPrecision(6)}/1K completion tokens, $${+(
                totalCost.prompt_token * 1000
              ).toPrecision(6)}/1K prompt tokens`,
            });
          }
        }

        if (evaluatorUsage.data.length !== 0) {
          for (const usage of evaluatorUsage.data) {
            const totalCost = costOf({
              model: usage.model,
              provider: usage.provider.toUpperCase(),
            });

            if (!totalCost) {
              console.error("No cost found for", usage.model, usage.provider);
              continue;
            }

            await stripe.invoiceItems.create({
              customer: customerID,
              invoice: invoice.id,
              currency: "usd",
              amount: Math.ceil(
                (totalCost.completion_token * usage.completion_tokens +
                  totalCost.prompt_token * usage.prompt_tokens) *
                  100
              ),
              description: `Evaluator: ${usage.provider}/${
                usage.model
              }: ${usage.completion_tokens.toLocaleString()} completion tokens, ${usage.prompt_tokens.toLocaleString()} prompt tokens, at $${+(
                totalCost.completion_token * 1000
              ).toPrecision(6)}/1K completion tokens, $${+(
                totalCost.prompt_token * 1000
              ).toPrecision(6)}/1K prompt tokens`,
            });
          }
        }
      } else {
        console.log("Invoice is not draft, skipping finalization");
      }
    } catch (error) {
      console.error("Error handling invoice creation:", error);
      throw error;
    }
  },

  async handleInvoiceUpcoming(event: Stripe.Event) {
    const invoice = event.data.object as Stripe.Invoice;

    try {
      if (invoice.subscription) {
        // await stripe.subscriptions.update(invoice.subscription as string, {
        //   metadata: {
        //     lastInvoicePreview: new Date().toISOString(),
        //   },
        // });
      }
    } catch (error) {
      console.error("Error handling upcoming invoice:", error);
      throw error;
    }
  },
};

const handler = async (req: NextApiRequest, res: NextApiResponse) => {
  if (req.method === "POST") {
    const buf = await buffer(req);
    const sig = req.headers["stripe-signature"]!;

    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(
        buf.toString(),
        sig,
        process.env.STRIPE_WEBHOOK_SECRET!
      ) as Stripe.Event;
    } catch (err) {
      res.status(400).send(`Webhook Error: ${err}`);
      return;
    }
    const stripeObject = event.data.object as
      | Stripe.Subscription
      | Stripe.Checkout.Session;

    const pricingFunctions =
      stripeObject.metadata?.["tier"] === "pro-20240913" ||
      stripeObject.metadata?.["tier"] === "pro-20250202"
        ? PricingVersion20240913
        : stripeObject.metadata?.["tier"] === "team-20250130"
        ? TeamVersion20250130
        : PricingVersionOld;

    if (event.type === "test_helpers.test_clock.advancing") {
      return res.status(200).end();
    }

    const knownUnhandledEvents = [
      "invoiceitem.created",
      "invoice.updated",
      "payment_intent.succeeded",
      "charge.succeeded",
      "payment_intent.created",
      "customer.updated",
      "test_helpers.test_clock.ready",
      "invoice.payment_succeeded",
      "invoice.paid",
      "invoice.finalized",
    ];

    if (knownUnhandledEvents.includes(event.type)) {
      console.log("Unhandled event type", event.type);
      return res.status(200).end();
    }

    if (event.type === "customer.subscription.created") {
      await pricingFunctions.handleCreate(event);
    } else if (event.type === "checkout.session.completed") {
      await pricingFunctions.handleCheckoutSessionCompleted(event);
    } else if (event.type === "customer.subscription.updated") {
      await pricingFunctions.handleUpdate(event);
    } else if (event.type === "customer.subscription.deleted") {
      await pricingFunctions.handleDelete(event);
    } else if (event.type === "invoice.created") {
      await InvoiceHandlers.handleInvoiceCreated(event);
    } else if (event.type === "invoice.upcoming") {
      await InvoiceHandlers.handleInvoiceUpcoming(event);
    } else {
      console.log("Unhandled event type", event.type);
      return res.status(400).end();
    }

    res.json({ received: true });
    res.status(200).end();
  } else {
    res.setHeader("Allow", "POST");
    res.status(405).end("Method Not Allowed");
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};

export default handler;
