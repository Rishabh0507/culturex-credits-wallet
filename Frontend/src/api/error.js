/** Pulls the API's error message out of an Axios error. */
export function apiError(err) {
  return err?.response?.data?.message || err?.message || 'Something went wrong';
}
