import {
  ModelProviderConfig,
  Plugin,
  PluginId,
} from "@helicone-package/cost/models/types";
import { ModelSpec } from "./types";

export class PluginHandler {
  /**
   * Process plugins for a model/provider combination
   * Currently only supports web search plugin
   */
  processPlugins(
    modelSpec: ModelSpec,
    providerConfig: ModelProviderConfig,
    requestPlugins?: Plugin[]
  ): Plugin[] {
    const plugins: Plugin[] = requestPlugins ? [...requestPlugins] : [];

    // If :online suffix, add web search plugin if not already present
    if (modelSpec.isOnline) {
      const existingWebPlugin = plugins.find((p) => p.id === "web");
      if (!existingWebPlugin) {
        // Add a minimal web plugin - the user didn't provide config
        plugins.push({ id: "web" });
      }
      // If there's already a web plugin, keep it with all its config
    }

    // Filter to only supported plugins and warn about unsupported ones
    return plugins.filter((plugin) => {
      const isSupported = this.supportsPlugin(providerConfig, plugin.id);
      if (!isSupported) {
        // Special message for :online modifier
        if (plugin.id === "web" && modelSpec.isOnline) {
          console.warn(
            `Web search (:online) is not supported for provider ${providerConfig.provider}`
          );
        } else {
          console.warn(
            `Plugin '${plugin.id}' is not supported by provider ${providerConfig.provider}`
          );
        }
      }
      return isSupported;
    });
  }

  /**
   * Check if provider supports a specific plugin
   */
  private supportsPlugin(
    providerConfig: ModelProviderConfig,
    pluginId: PluginId
  ): boolean {
    const supportedPlugins = providerConfig.supportedPlugins;

    // No plugins supported
    if (!supportedPlugins) {
      return false;
    }

    return supportedPlugins.includes(pluginId);
  }
}
