import React from 'react';
import { ColumnFormatted } from './themedTableV3';
import { FilterNode } from '../../../services/lib/filters/filterDefs';
import { UIFilterRow } from './themedAdvancedFilters';
import { NextApiRequest, NextApiResponse } from 'next';
import { Layout, getUserLayouts } from '../../your-path-to/getUserLayouts';
import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Database } from '../../../supabase/database.types';

export interface Layout {
  id: number;
  column_sizes: string;
  column_order: string;
  user_id: string;
}


interface SaveLayoutButtonProps {
  columns: ColumnFormatted[];
  advancedFilters: UIFilterRow[];
  timeFilter: FilterNode;
}

const SaveLayoutButton: React.FC<SaveLayoutButtonProps> = ({
    columns,
    advancedFilters,
    timeFilter,
}) => {
    const handleSaveLayout = async () => {
    try {
      const response = await fetch('/api/saveLayout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ columns, filters: { advancedFilters, timeFilter }}),
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.statusText}`);
      }

      const layoutData = await response.json();
      console.log('Saved layout:', layoutData);
    } catch (error) {
      console.error('Error saving layout:', error);
    }
  };

  return (
    <button type="button" onClick={handleSaveLayout}>
      Save Layout
    </button>
  );
};

export default SaveLayoutButton;