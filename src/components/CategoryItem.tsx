import { Link } from "react-router-dom";

const categoryImageMap = import.meta.glob("../assets/*", {
  eager: true,
  import: "default",
}) as Record<string, string>;

const CategoryItem = ({
  categoryTitle,
  image,
  link,
}: {
  categoryTitle: string;
  image: string;
  link: string;
}) => {
  const imageSrc = categoryImageMap[`../assets/${image}`] ?? "";

  return (
    <div className="w-[600px] relative max-[1250px]:w-[400px] max-[1250px]:h-[400px] max-sm:w-[300px] max-sm:h-[300px]">
      <Link to={`/shop/${link}`}>
        <img
          src={imageSrc}
          alt={categoryTitle}
          className="h-full w-full object-cover"
        />
        <div className="bg-secondaryBrown text-white absolute bottom-0 w-full h-16 flex justify-center items-center max-sm:h-12">
          <h3 className="text-2xl max-sm:text-xl">{categoryTitle}</h3>
        </div>
      </Link>
    </div>
  );
};
export default CategoryItem;
