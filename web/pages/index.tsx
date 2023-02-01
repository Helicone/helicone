import { XMarkIcon } from "@heroicons/react/24/outline";
import {
  ArrowDownIcon,
  ChevronRightIcon,
  MinusIcon,
  PlusIcon,
} from "@heroicons/react/24/solid";
import { createServerSupabaseClient } from "@supabase/auth-helpers-nextjs";
import { useUser } from "@supabase/auth-helpers-react";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useState } from "react";
import Advanced from "../components/shared/advanced";
import NavBar from "../components/shared/layout/navBar";
import MetaData from "../components/shared/metaData";
import Test from "../components/shared/test";
import HomePage from "../components/templates/home/homePage";
import { redirectIfLoggedIn } from "../lib/redirectIdLoggedIn";

interface HomeProps {}

const Home = (props: HomeProps) => {
  const {} = props;

  return (
    <MetaData title="Home">
      <HomePage />
      <Test />
      <Advanced />
    </MetaData>
  );
};

export default Home;

export const getServerSideProps = redirectIfLoggedIn("/dashboard", async () => {
  return {
    props: {},
  };
});
