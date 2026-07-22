export const countStatusesForField = (
  apiResponse: Record<string, unknown>,
  fieldName: string
): Record<string, number> | { error: string } => {
  if (!apiResponse[fieldName]) {
    return {
      error: `Field "${fieldName}" not found in the response`,
    };
  }

  const fieldData = apiResponse[fieldName];
  if (!Array.isArray(fieldData)) {
    return {
      error: `Field "${fieldName}" is not an array`,
    };
  }

  return fieldData.reduce((acc: Record<string, number>, item: { status?: string }) => {
    if (item.status) {
      acc[item.status] = (acc[item.status] || 0) + 1;
    }
    return acc;
  }, {});
};
