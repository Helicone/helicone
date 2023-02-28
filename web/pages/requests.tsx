import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { GetServerSidePropsContext } from "next";
import AuthLayout from "../components/shared/layout/authLayout";
import MetaData from "../components/shared/metaData";
import RequestsPage from "../components/templates/requests/requestsPage";
import { getProperties } from "../lib/api/properties/properties";
import { unwrapAsync } from "../lib/result";
import { getPromptValues } from "../lib/api/prompts/prompts";

interface RequestsProps {
  user: any;
  page: number;
  pageSize: number;
  sortBy: string | null;
  // properties: string[];
  values: string[];
}

const Requests = (props: RequestsProps) => {
  const { user, page, pageSize, sortBy, values } = props;

  return (
    <MetaData title="Requests">
      <AuthLayout user={user}>
        <RequestsPage
          page={page}
          pageSize={pageSize}
          sortBy={sortBy}
          values={values}
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

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session)
    return {
      redirect: {
        destination: "/login",
        permanent: false,
      },
    };

  const { page, page_size, sort } = context.query;

  const currentPage = parseInt(page as string, 10) || 1;
  const pageSize = parseInt(page_size as string, 10) || 25;
  const sortBy = (sort as string) || null;

  // let allProperties: string[] = [];
  // try {
  //   allProperties = (await unwrapAsync(getProperties(session.user.id))).map(
  //     (property) => {
  //       return property.property;
  //     }
  //   );
  // } catch (err) {
  //   console.error(err);
  //   allProperties = [];
  // }

  let allValues: string[] = [];
  try {
    allValues = (await unwrapAsync(getPromptValues(session.user.id))).map(
      (value) => {
        return value.value;
      }
    );
  } catch (err) {
    console.error(err);
    allValues = [];
  }

  return {
    props: {
      initialSession: session,
      user: session.user,
      page: currentPage,
      pageSize: pageSize,
      sortBy: sortBy,
      // properties: allProperties,
      values: allValues,
    },
  };
};
