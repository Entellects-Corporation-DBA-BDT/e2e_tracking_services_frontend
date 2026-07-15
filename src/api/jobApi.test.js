import { createJob, deleteJob, updateJob } from "./jobApi";
import axiosInstance from "./axiosInstance";

jest.mock("./axiosInstance", () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe("jobApi", () => {
  beforeEach(() => jest.clearAllMocks());

  it("creates a job with the JSON contract expected by the backend", async () => {
    const payload = { position: "React Developer", job_description: "React" };
    axiosInstance.post.mockResolvedValueOnce({ data: { success: true } });

    await createJob(payload);

    expect(axiosInstance.post).toHaveBeenCalledWith("/jobs/create", payload);
  });

  it("updates the selected job", async () => {
    const payload = { position: "Senior React Developer" };
    axiosInstance.put.mockResolvedValueOnce({ data: { success: true } });

    await updateJob(9, payload);

    expect(axiosInstance.put).toHaveBeenCalledWith("/jobs/update/9", payload);
  });

  it("deletes the selected job", async () => {
    axiosInstance.delete.mockResolvedValueOnce({ data: { success: true } });

    await deleteJob(9);

    expect(axiosInstance.delete).toHaveBeenCalledWith("/jobs/delete/9");
  });
});
