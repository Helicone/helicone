"use client";

interface AdminPageProps {}

const AdminPage = (props: AdminPageProps) => {
  const {} = props;

  return (
    <div className="flex flex-col space-y-4">
      <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
      <div className="flex max-w-4xl flex-col space-y-4">
        <p className="text-muted-foreground">
          Welcome to the admin dashboard. Use the sidebar to navigate to different admin tools.
        </p>
      </div>
    </div>
  );
};

export default AdminPage;
