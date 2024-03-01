import React from 'react';
import Image from 'next/image';
import { useUsers } from '../../hooks/useUsers'; // Change this to the actual import path of useUsers
import AuthHeader from '../molecules/AuthHeader';
import ThemedTableV5 from '../molecules/ThemedTableV5'; // Change this to the actual import path if different

const UserDocsLink = () => (
  <div className="my-4 flex justify-center">
    <a href="https://docs.helicone.ai/features/advanced-usage/user-metrics" target="_blank" rel="noopener noreferrer" className="rounded-lg overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-200">
      <Image src="/assets/UserDocsGraphic.svg" alt="Learn more about adding users" width={350} height={100} />
    </a>
  </div>
);

const UsersPageV2 = () => {
  const { users, count, error, isLoading } = useUsers();

  if (error) {
    // Handle the error according to project standards, this could be showing an error message
    // Example:
    return <div>Error loading users</div>;
  }

  if (isLoading) {
    // Handle the loading state according to project standards, this could be showing a loading spinner
    // Example:
    return <div>Loading...</div>;
  }

  const showUserDocsLink = count <= 1;

  return (
    <>
      <AuthHeader title={"Users"} />
      <div className="flex flex-col space-y-4">
        {showUserDocsLink && <UserDocsLink />}
        <ThemedTableV5
          // props have been omitted for brevity, add actual props according to project standards
        />
        {/* Rest of the UsersPageV2 component code */}
      </div>
    </>
  );
};

export default UsersPageV2;
