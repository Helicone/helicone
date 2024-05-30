interface AboutPageProps {}

const AboutPage = (props: AboutPageProps) => {
  const {} = props;

  return (
    <div className="w-full h-full antialiased text-black">
      <div className="h-full">
        <div className="flex flex-col mx-auto w-full gap-8 max-w-6xl p-4 md:px-8 pb-24 pt-10 sm:pb-32 lg:flex lg:py-24 antialiased">
          <h1>Hello</h1>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
