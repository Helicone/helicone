import DashboardBig from "@/public/static/home/dashboardbig";

const BigDashboard = () => {
  return (
    <div className="relative mx-auto h-full w-full">
      <DashboardBig />
      <div className="absolute bottom-0 hidden h-[100px] w-full bg-[#f2f9fc] md:block"></div>
    </div>
  );
};

export default BigDashboard;
