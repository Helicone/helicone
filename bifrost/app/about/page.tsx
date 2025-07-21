interface AboutPageProps {}

const AboutPage = (props: AboutPageProps) => {
  const {} = props;

  return (
    <div className="h-full w-full text-black antialiased">
      <div className="h-full">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 p-4 pb-24 pt-10 antialiased sm:pb-32 md:px-8 lg:flex lg:py-24">
          <h1>Hello</h1>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
