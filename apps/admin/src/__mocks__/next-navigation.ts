const useRouter = jest.fn(() => ({
  push: jest.fn(),
  replace: jest.fn(),
  refresh: jest.fn(),
  back: jest.fn(),
  forward: jest.fn(),
  prefetch: jest.fn(),
}));

const usePathname = jest.fn(() => '/');
const useSearchParams = jest.fn(() => new URLSearchParams());
const useParams = jest.fn(() => ({}));
const redirect = jest.fn();
const notFound = jest.fn();

export {
  useRouter,
  usePathname,
  useSearchParams,
  useParams,
  redirect,
  notFound,
};
