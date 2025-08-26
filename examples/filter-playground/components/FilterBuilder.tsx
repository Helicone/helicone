'use client';

import { useState } from 'react';
import { FilterNode } from '@helicone-package/filters';

export default function FilterBuilder() {
  const [filter, setFilter] = useState<FilterNode>({
    request_response_rmt: {
      status: {
        equals: 200
      }
    }
  });
  const [sqlOutput, setSqlOutput] = useState('');
  const [dbType, setDbType] = useState<'postgres' | 'clickhouse'>('postgres');
  const [errors, setErrors] = useState<string[]>([]);

  const addCondition = () => {
    setFilter(prev => {
      // If it's a simple filter, convert to branch structure
      if (prev !== 'all' && !('operator' in prev)) {
        return {
          left: prev,
          operator: 'and' as const,
          right: {
            request_response_rmt: {
              model: {
                equals: 'gpt-4'
              }
            }
          }
        };
      }
      
      // If it's already a branch, add another condition
      if (typeof prev === 'object' && 'operator' in prev) {
        return {
          left: prev,
          operator: 'and' as const,
          right: {
            request_response_rmt: {
              latency: {
                gte: 100
              }
            }
          }
        };
      }
      
      return prev;
    });
  };

  const buildFilter = async () => {
    try {
      const response = await fetch('/api/filter/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter, dbType })
      });

      const result = await response.json();
      
      if (response.ok) {
        setSqlOutput(result.sql);
        setErrors([]);
      } else {
        setErrors([result.error]);
      }
    } catch (error) {
      setErrors(['Failed to build filter']);
    }
  };

  const clearFilter = () => {
    setFilter({
      request_response_rmt: {
        status: {
          equals: 200
        }
      }
    });
    setSqlOutput('');
    setErrors([]);
  };

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-3 text-gray-800">Filter Builder</h2>
        
        <div className="space-y-3">
          <div className="flex gap-2">
            <select
              value={dbType}
              onChange={(e) => setDbType(e.target.value as 'postgres' | 'clickhouse')}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="clickhouse">ClickHouse</option>
            </select>

            <button
              onClick={addCondition}
              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
            >
              Add Condition
            </button>

            <button
              onClick={buildFilter}
              className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700"
            >
              Build SQL
            </button>

            <button
              onClick={clearFilter}
              className="px-3 py-1.5 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700"
            >
              Clear
            </button>
          </div>

          <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
            <h3 className="font-semibold text-sm mb-2 text-gray-800">Current Filter:</h3>
            <pre className="text-xs overflow-x-auto font-mono max-h-48 overflow-y-auto">
              {JSON.stringify(filter, null, 2)}
            </pre>
          </div>

          {sqlOutput && (
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-sm mb-2 text-blue-800">Generated SQL:</h3>
              <code className="text-xs font-mono">{sqlOutput}</code>
            </div>
          )}

          {errors.length > 0 && (
            <div className="bg-red-50 p-3 rounded-lg border border-red-200">
              <h3 className="font-semibold text-sm mb-2 text-red-800">Errors:</h3>
              <ul className="list-disc list-inside">
                {errors.map((error, i) => (
                  <li key={i} className="text-red-700 text-xs">{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}