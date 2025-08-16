UPDATE organization 
SET onboarding_status = onboarding_status - 'hasCompletedQuickstart'
WHERE onboarding_status ? 'hasCompletedQuickstart';