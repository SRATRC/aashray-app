export default function mergeLists(list1, list2) {
  // Create an object to store values by titles
  const mergedObj = {};

  // Merge values from both lists
  for (const list of [list1, list2]) {
    for (const item of list) {
      const { title, data } = item;
      if (!mergedObj[title]) {
        mergedObj[title] = data.slice(); // Create a copy of the array
      } else {
        mergedObj[title].push(...data);
      }
    }
  }

  // Convert merged object back to array
  const finalList = Object.keys(mergedObj).map((title) => ({
    title,
    data: mergedObj[title]
  }));

  return finalList;
}
