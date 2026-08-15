import axios, { AxiosRequestConfig, AxiosResponse } from 'axios';
export async function axiosGetWithRetries<T>(
  config: AxiosRequestConfig,
  retries: number = 2,
  delay: number = 1000
): Promise<AxiosResponse<T>> {
  let attempt = 0;
  while (attempt <= retries) {
    try {
      const response = await axios.get<T>(config.url!, config);
      if (response.status === 200) {
        return response;
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error) {
      if (attempt === retries) {
        throw error;
      }
      attempt++;
      console.warn(`Attempt ${attempt} failed for ${config.url}. Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
  throw new Error('Exceeded maximum retry attempts');
}
