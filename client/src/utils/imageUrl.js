export const optimizeImageUrl = (
  url,
  width = 600
) => {
  if (
    !url ||
    !url.includes(
      "res.cloudinary.com"
    )
  ) {
    return url;
  }

  if (!url.includes("/upload/")) {
    return url;
  }

  return url.replace(
    "/upload/",
    `/upload/f_auto,q_auto,c_limit,w_${width}/`
  );
};