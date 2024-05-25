export const getIsValidUrl = (url: string): boolean => {
  const urlRegex = /^(https?:\/\/)?([\da-z.-]+\.[a-z.]{2,6}|[\d.]+|localhost)([/:?=&#]{1}[\da-z.-]+)*[/?]?$/mg;
  return urlRegex.test(url);
};
