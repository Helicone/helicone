import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import RequestsPage from "../components/templates/requests/requestsPage";
import { getProperties } from "../lib/api/properties/properties";
import { unwrapAsync } from "../lib/result";
import { getRequests, ResponseAndRequest } from "../services/lib/requests";

interface RequestsProps {
  user: any;
  error: string | null;
  data: ResponseAndRequest[];
  count: number | null;
  page: number;
  from: number;
  to: number;
  properties: string[];
}

const Requests = (props: RequestsProps) => {
  const { user, data, error, count, page, from, to, properties } = props;
  console.log("REQUESTS PAGE")

  return (
    <MetaData title="Requests">
      <AuthLayout user={user}>
        <RequestsPage
          requests={data}
          error={error}
          count={count}
          page={page}
          from={from}
          to={to}
          properties={properties}
        />
      </AuthLayout>
    </MetaData>
  );
};

export default Requests;

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const supabase = createServerSupabaseClient(context);
  const user = await supabase.auth.getUser();
  console.log("USER", user)

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !user.data || !user.data.user)
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };

  const { page, page_size } = context.query;

  let currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 25;

  const { data, error, count, from, to } = await getRequests(
    supabase,
    currentPage,
    pageSize
  );

  // get all the properties for this user
  console.log("USER ID", user.data.user.id)

  const allProperties = (await unwrapAsync(getProperties(user.data.user.id)))
    .map((property) => {
      return property.property;
    })


  console.log("ALL PROPERTIES", allProperties)

  // const allProperties = await unwrapAsync(getProperties(user.data.user.id))
  // console.log("ALL PROPERTIES", allProperties)

  console.log("AM I EVER CALLED")

  return {
    props: {
      initialSession: session,
      user: session.user,
      error: error?.message || null,
      data: (data as ResponseAndRequest[]) || [],
      count: count,
      page: currentPage,
      from: from,
      to: to,
      properties: allProperties,
    },
  };
};
