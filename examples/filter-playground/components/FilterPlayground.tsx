'use client';

import { useState } from 'react';
import { FilterNode } from '@helicone-package/filters';

const sampleFilters: { name: string; filter: FilterNode }[] = [
  {
    name: 'Simple Status Filter',
    filter: {
      request_response_rmt: {
        status: {
          equals: 200
        }
      }
    }
  },
  {
    name: 'Complex AND Filter',
    filter: {
      left: {
        request_response_rmt: {
          status: {
            equals: 200
          }
        }
      },
      operator: 'and',
      right: {
        request_response_rmt: {
          model: {
            equals: 'gpt-4'
          }
        }
      }
    }
  },
  {
    name: 'Range Filter',
    filter: {
      request_response_rmt: {
        latency: {
          gte: 100,
          lte: 1000
        }
      }
    }
  },
  {
    name: 'All Records',
    filter: 'all'
  }
];

export default function FilterPlayground() {
  const [filterInput, setFilterInput] = useState(
    JSON.stringify(sampleFilters[0].filter, null, 2)
  );
  const [dbType, setDbType] = useState<'postgres' | 'clickhouse'>('postgres');
  const [result, setResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const testFilter = async () => {
    setLoading(true);
    try {
      // First validate
      const validateResponse = await fetch('/api/filter/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter: JSON.parse(filterInput) })
      });
      const validation = await validateResponse.json();
      setValidationResult(validation);

      if (validation.valid) {
        // Then build
        const buildResponse = await fetch('/api/filter/build', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            filter: JSON.parse(filterInput),
            dbType 
          })
        });
        const buildResult = await buildResponse.json();
        setResult(buildResult);
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: ['Invalid JSON format']
      });
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const loadSampleFilter = (filter: FilterNode) => {
    setFilterInput(JSON.stringify(filter, null, 2));
    setResult(null);
    setValidationResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-4 text-gray-900">Helicone Filter Playground</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Input Section */}
          <div className="space-y-3">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h2 className="text-lg font-semibold mb-3 text-gray-800">Filter Input</h2>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Database Type
                  </label>
                  <select
                    value={dbType}
                    onChange={(e) => setDbType(e.target.value as 'postgres' | 'clickhouse')}
                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 text-sm"
                  >
                    <option value="postgres">PostgreSQL</option>
                    <option value="clickhouse">ClickHouse</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1 text-gray-700">
                    Filter JSON
                  </label>
                  <textarea
                    value={filterInput}
                    onChange={(e) => setFilterInput(e.target.value)}
                    className="w-full h-[20rem] px-3 py-2 font-mono text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900"
                    placeholder="Enter your filter JSON here..."
                  />
                </div>

                <button
                  onClick={testFilter}
                  disabled={loading}
                  className="w-full px-4 py-2 bg-blue-600 text-white font-medium text-sm rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? 'Processing...' : 'Test Filter'}
                </button>
              </div>
            </div>

            {/* Sample Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-sm font-semibold mb-2 text-gray-800">Sample Filters</h3>
              <div className="space-y-1">
                {sampleFilters.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => loadSampleFilter(sample.filter)}
                    className="w-full text-left px-3 py-1.5 bg-gray-50 text-gray-700 rounded hover:bg-gray-100 hover:text-gray-900 transition-colors text-sm"
                  >
                    {sample.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Output Section */}
          <div className="space-y-3">
            {/* Validation Result */}
            {validationResult && (
              <div className={`bg-white p-3 rounded-lg shadow-sm border-l-4 ${
                validationResult.valid ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'
              }`}>
                <h3 className={`text-sm font-semibold mb-1 ${
                  validationResult.valid ? 'text-green-800' : 'text-red-800'
                }`}>
                  Validation {validationResult.valid ? '✓ Passed' : '✗ Failed'}
                </h3>
                {validationResult.errors?.length > 0 && (
                  <ul className="list-disc list-inside text-red-700 text-sm space-y-0.5">
                    {validationResult.errors.map((error: string, i: number) => (
                      <li key={i}>{error}</li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* Build Result */}
            {result && (
              <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <h3 className="text-sm font-semibold mb-3 text-gray-800">Build Result</h3>
                
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-xs text-gray-600 mb-1">Database Type:</h4>
                    <p className="font-mono text-xs text-gray-900 bg-gray-50 px-2 py-1 rounded inline-block">{result.dbType}</p>
                  </div>

                  <div>
                    <h4 className="font-medium text-xs text-gray-600 mb-1">Generated WHERE Clause:</h4>
                    <pre className="bg-gray-900 text-green-400 p-2 rounded text-xs overflow-x-auto font-mono max-h-32 overflow-y-auto">
{result.filter}
                    </pre>
                  </div>

                  <div>
                    <h4 className="font-medium text-xs text-gray-600 mb-1">Full SQL Example:</h4>
                    <pre className="bg-gray-900 text-green-400 p-2 rounded text-xs overflow-x-auto font-mono max-h-32 overflow-y-auto">
{result.sql}
                    </pre>
                  </div>

                  {result.args?.length > 0 && (
                    <div>
                      <h4 className="font-medium text-xs text-gray-600 mb-1">Parameters:</h4>
                      <pre className="bg-gray-50 text-gray-900 p-2 rounded text-xs overflow-x-auto font-mono border border-gray-200 max-h-24 overflow-y-auto">
{JSON.stringify(result.args, null, 2)}
                      </pre>
                    </div>
                  )}

                  {result.error && (
                    <div className="bg-red-50 p-2 rounded border border-red-200">
                      <p className="text-red-700 text-sm font-medium">{result.error}</p>
                      {result.details && (
                        <p className="text-xs text-red-600 mt-1">{result.details}</p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}