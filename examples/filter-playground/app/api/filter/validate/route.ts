import { NextRequest, NextResponse } from 'next/server';
import { FilterNode } from '@helicone-package/filters';

function validateFilter(filter: FilterNode): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!filter) {
    errors.push('Filter is required');
    return { valid: false, errors };
  }

  if (filter === 'all') {
    return { valid: true, errors: [] };
  }

  // Validate filter structure
  if (typeof filter === 'object') {
    // Check for branch node
    if ('left' in filter && 'operator' in filter && 'right' in filter) {
      const validOperators = ['and', 'or'];
      if (!validOperators.includes(filter.operator)) {
        errors.push(`Invalid operator: ${filter.operator}. Must be one of: ${validOperators.join(', ')}`);
      }
      
      // Recursively validate left and right
      const leftResult = validateFilter(filter.left);
      const rightResult = validateFilter(filter.right);
      errors.push(...leftResult.errors, ...rightResult.errors);
    } 
    // Check for leaf node (various formats)
    else if (Object.keys(filter).length > 0) {
      // This is a simplified validation - in a real app you'd validate the structure more thoroughly
      return { valid: true, errors: [] };
    } else {
      errors.push('Invalid filter structure');
    }
  } else {
    errors.push('Filter must be an object or "all"');
  }

  return { valid: errors.length === 0, errors };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filter } = body as { filter: FilterNode };

    const validation = validateFilter(filter);

    return NextResponse.json({
      valid: validation.valid,
      errors: validation.errors,
      filter: validation.valid ? filter : null,
    });
  } catch (error) {
    console.error('Error validating filter:', error);
    return NextResponse.json(
      { 
        valid: false, 
        errors: ['Failed to parse filter JSON'], 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 400 }
    );
  }
}