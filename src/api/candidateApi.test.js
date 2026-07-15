import { createCandidate } from "./candidateApi";
import axiosInstance from "./axiosInstance";

jest.mock("./axiosInstance", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    get: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("candidateApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("posts form data without forcing a manual multipart content-type header", async () => {
    const payload = new FormData();
    axiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

    await createCandidate(payload);

    expect(axiosInstance.post).toHaveBeenCalledTimes(1);
    const [url, formData, config] = axiosInstance.post.mock.calls[0];
    expect(url).toBe("/candidate/create");
    expect(formData).toBe(payload);
    expect(config).toBeUndefined();
  });
});
