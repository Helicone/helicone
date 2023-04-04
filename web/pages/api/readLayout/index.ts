import { useSupabaseClient } from "@supabase/auth-helpers-react";
import { Layout } from "../../../components/shared/themed/themedSaveLayout";
import { Database } from "../../../supabase/database.types";


export async function getUserLayouts(userId: string): Promise<Layout[]> {
    const supabaseClient = useSupabaseClient<Database>();

    const { data, error } = await supabaseClient
        .from('layout')
        .select('*')
        .eq('user_id', userId);

    if (error) {
        console.error('Error fetching user layouts:', error);
        throw error;
    }

    return data || [];
}