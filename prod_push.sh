
project_ref_input=$1
default_project_ref="bolqqmqbrciybnypvklh"
project_ref=${project_ref_input:-$default_project_ref}
echo "Pushing to project ref: $project_ref"
supabase link --project-ref $project_ref
supabase db push

jhkfdhdf