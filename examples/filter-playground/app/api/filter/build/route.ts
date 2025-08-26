import { NextRequest, NextResponse } from 'next/server';
import { 
  buildFilterClickHouse, 
  buildFilterPostgres, 
  FilterNode,
  ExternalBuildFilterArgs 
} from '@helicone-package/filters';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filter, dbType = 'postgres' } = body as {
      filter: FilterNode;
      dbType?: 'postgres' | 'clickhouse';
    };

    if (!filter) {
      return NextResponse.json(
        { error: 'Filter is required' },
        { status: 400 }
      );
    }

    const args: ExternalBuildFilterArgs = {
      filter,
      argsAcc: [],
    };

    const result = dbType === 'clickhouse' 
      ? buildFilterClickHouse(args)
      : buildFilterPostgres(args);

    return NextResponse.json({
      dbType,
      filter: result.filter,
      args: result.argsAcc,
      sql: `SELECT * FROM your_table WHERE ${result.filter}`,
    });
  } catch (error) {
    console.error('Error building filter:', error);
    return NextResponse.json(
      { error: 'Failed to build filter', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}