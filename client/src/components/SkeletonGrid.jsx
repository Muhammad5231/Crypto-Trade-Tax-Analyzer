function SkeletonGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="shimmer h-32 rounded-[26px] bg-white/60 dark:bg-white/5" />
      ))}
    </div>
  );
}

export default SkeletonGrid;
