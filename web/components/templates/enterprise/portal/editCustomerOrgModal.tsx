import { Database } from "../../../../supabase/database.types";
import ThemedDrawer from "../../../shared/themed/themedDrawer";
import CreateOrgForm, { OrgLimits } from "../../organization/createOrgForm";

interface EditCustomerOrgModalProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  onSuccess: () => void;
  initialValues?: {
    id: string;
    name: string;
    color: string | null;
    icon: string | null;
    providerKey: string | null;
    limits?: OrgLimits;
  };
}

const EditCustomerOrgModal = (props: EditCustomerOrgModalProps) => {
  const { open, setOpen, onSuccess, initialValues } = props;

  return (
    <ThemedDrawer open={open} setOpen={setOpen}>
      <div className="flex flex-col space-y-4">
        <p className="text-2xl font-semibold text-black dark:text-white border-b border-gray-300 dark:border-gray-700 py-4">
          Edit Customer
        </p>
        <CreateOrgForm
          variant="reseller"
          onSuccess={() => {
            setOpen(false);
            onSuccess();
          }}
          initialValues={initialValues}
        />
      </div>
    </ThemedDrawer>
  );
};

export default EditCustomerOrgModal;
