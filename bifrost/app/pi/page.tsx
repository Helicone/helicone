const PiPage = () => {
  return (
    <div className="h-[80vh] w-full flex justify-center items-center">
      <div className="text-6xl font-bold truncate max-w-[80vw]">
        {Math.PI.toFixed(100)}
      </div>
    </div>
  );
};

export default PiPage;
