import {
  createCandidate,
  deleteCandidate,
  getMatchedJobs,
  matchSuitableJobs,
  updateCandidate,
} from "./candidateApi";
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

  it("starts candidate-to-job matching for the selected candidate", async () => {
    axiosInstance.post.mockResolvedValueOnce({
      data: { success: true, results: [] },
    });

    await matchSuitableJobs(17);

    expect(axiosInstance.post).toHaveBeenCalledWith(
      "/matching/candidate/start/17"
    );
  });

  it("loads stored suitable jobs for the selected candidate", async () => {
    axiosInstance.get.mockResolvedValueOnce({
      data: { success: true, data: [] },
    });

    await getMatchedJobs(17);

    expect(axiosInstance.get).toHaveBeenCalledWith("/matching/candidate/17");
  });

  it("uses the backend-supported POST route for multipart candidate updates", async () => {
    const payload = new FormData();
    axiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

    await updateCandidate(17, payload);

    expect(axiosInstance.post).toHaveBeenCalledWith(
      "/candidate/update/17",
      payload
    );
  });

  it("deletes the selected candidate", async () => {
    axiosInstance.delete.mockResolvedValueOnce({ data: { success: true } });

    await deleteCandidate(17);

    expect(axiosInstance.delete).toHaveBeenCalledWith("/candidate/delete/17");
  });
});
