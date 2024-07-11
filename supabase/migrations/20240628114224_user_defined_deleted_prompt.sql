UPDATE prompt_v2
SET 
    user_defined_id = user_defined_id || '_deleted_' || id
WHERE soft_delete = true;
