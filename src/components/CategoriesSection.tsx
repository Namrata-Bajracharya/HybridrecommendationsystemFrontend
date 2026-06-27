import CategoryItem from "./CategoryItem";

const CategoriesSection = () => {
  return (
    <div className="max-w-screen-2xl px-5 mx-auto mt-24">
      <h2 className="text-black text-5xl font-normal tracking-[1.56px] max-sm:text-4xl mb-12">
        Our Categories
      </h2>
      <div className="flex justify-between flex-wrap gap-y-10">
        <CategoryItem categoryTitle="Shoes" image="shoes.png" link="shoes" />
        <CategoryItem categoryTitle="Kurtha" image="kurtha.png" link="kurtha" />
        <CategoryItem categoryTitle="Sari" image="sari.png" link="sari" />
        <CategoryItem
          categoryTitle="jewellery"
          image="jewellery.png"
          link="jewellery"
        />
      </div>
    </div>
  );
};
export default CategoriesSection;
