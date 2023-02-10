import { FilterNode } from "../../../lib/api/metrics/filters";

export function Filters({
  keys,
  filter,
  setFilter,
}: {
  keys: {
    created_at: string;
    api_key_hash: string;
    api_key_preview: string;
    user_id: string;
    key_name: string | null;
  }[];
  filter: FilterNode;
  setFilter: (filter: FilterNode) => void;
}) {
  return (
    <div className="flex flex-row items-center gap-2">
      <label
        htmlFor="location"
        className="block text-sm font-medium text-gray-700 whitespace-nowrap"
      >
        API Key:
      </label>
      <select
        id="location"
        name="location"
        className="form-select block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
        defaultValue={"all"}
        onChange={(e) => {
          if (e.target.value !== "all") {
            setFilter({
              user_api_keys: {
                api_key_hash: {
                  equals: {
                    api_key_hash: [e.target.value],
                  },
                },
              },
            });
          } else {
            setFilter("all");
          }
        }}
      >
        <option value={"all"}>All</option>
        {keys.map((key) => (
          <option key={key.api_key_hash} value={key.api_key_hash}>
            {key.key_name === "" ? key.api_key_preview : key.key_name}
          </option>
        ))}
      </select>
    </div>
  );
}
