resource "datadog_dashboard_json" "hql_overview" {
  dashboard = <<JSON
{
  "title": "HQL Overview",
  "description": "Overview of Helicone Query Language traces (counts, latency, errors).",
  "layout_type": "ordered",
  "template_variables": [
    { "name": "service", "prefix": "service" },
    { "name": "env", "prefix": "env" }
  ],
  "widgets": [
    {
      "definition": {
        "type": "timeseries",
        "title": "HQL span count by operation",
        "show_legend": true,
        "requests": [
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.executeSql"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.getClickHouseSchema"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.downloadCsv"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}}
        ]
      }
    },
    {
      "definition": {
        "type": "timeseries",
        "title": "executeSql latency (p50/p95/p99)",
        "show_legend": true,
        "requests": [
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.executeSql"}, "compute": {"aggregation": "pc50"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.executeSql"}, "compute": {"aggregation": "pc95"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.executeSql"}, "compute": {"aggregation": "pc99"}, "group_by": [{"facet": "resource_name"}]}}
        ]
      }
    },
    {
      "definition": {
        "type": "timeseries",
        "title": "executeSql hits vs errors",
        "show_legend": true,
        "requests": [
          {"display_type": "line", "style": {"palette": "dog_classic"}, "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.executeSql"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "style": {"palette": "warm"}, "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.executeSql status:error"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}}
        ]
      }
    },
    {
      "definition": {
        "type": "toplist",
        "title": "Top HQL resources by p95 latency - executeSql",
        "requests": [
          {"apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.executeSql"}, "compute": {"aggregation": "pc95"}, "group_by": [{"facet": "resource_name"}]}}
        ]
      }
    },
    {
      "definition": {
        "type": "toplist",
        "title": "Top HQL resources by p95 latency - getClickHouseSchema",
        "requests": [
          {"apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.getClickHouseSchema"}, "compute": {"aggregation": "pc95"}, "group_by": [{"facet": "resource_name"}]}}
        ]
      }
    },
    {
      "definition": {
        "type": "toplist",
        "title": "Top HQL resources by p95 latency - downloadCsv",
        "requests": [
          {"apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.downloadCsv"}, "compute": {"aggregation": "pc95"}, "group_by": [{"facet": "resource_name"}]}}
        ]
      }
    }
  ]
}
JSON
}

resource "datadog_dashboard_json" "hql_controllers" {
  dashboard = <<JSON
{
  "title": "HQL Controllers",
  "description": "Controller-level HQL traces (counts, latency, errors).",
  "layout_type": "ordered",
  "template_variables": [
    { "name": "service", "prefix": "service" },
    { "name": "env", "prefix": "env" }
  ],
  "widgets": [
    {
      "definition": {
        "type": "timeseries",
        "title": "Controller span counts",
        "show_legend": true,
        "requests": [
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.controller.executeSql"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.controller.getClickHouseSchema"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.controller.downloadCsv"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}}
        ]
      }
    },
    {
      "definition": {
        "type": "timeseries",
        "title": "Controller p95 latency",
        "show_legend": true,
        "requests": [
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.controller.executeSql"}, "compute": {"aggregation": "pc95"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.controller.getClickHouseSchema"}, "compute": {"aggregation": "pc95"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.controller.downloadCsv"}, "compute": {"aggregation": "pc95"}, "group_by": [{"facet": "resource_name"}]}}
        ]
      }
    },
    {
      "definition": {
        "type": "timeseries",
        "title": "Controller errors",
        "show_legend": true,
        "requests": [
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.controller.executeSql status:error"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.controller.getClickHouseSchema status:error"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}},
          {"display_type": "line", "apm_query": {"index": "trace-search", "search": {"query": "service:$service env:$env name:hql.controller.downloadCsv status:error"}, "compute": {"aggregation": "count"}, "group_by": [{"facet": "resource_name"}]}}
        ]
      }
    }
  ]
}
JSON
}


