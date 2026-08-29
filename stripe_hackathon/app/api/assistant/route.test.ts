import { beforeEach, expect, test, vi } from "vitest";

const { createAssistantHandler, handler } = vi.hoisted(() => ({
  createAssistantHandler: vi.fn(),
  handler: vi.fn(),
}));

vi.mock("@/lib/assistant-server", () => ({ createAssistantHandler }));

beforeEach(() => {
  createAssistantHandler.mockReturnValue(handler);
  handler.mockReset();
});

test("POST uses the Node runtime and delegates to the Assistant handler", async () => {
  const response = new Response("ok");
  const request = new Request("http://localhost/api/assistant", {
    method: "POST",
  });
  handler.mockResolvedValue(response);

  const route = await import("./route");

  expect(Object.keys(route).sort()).toEqual(["POST", "runtime"]);
  expect(route.runtime).toBe("nodejs");
  expect(createAssistantHandler).toHaveBeenCalledWith(fetch);
  await expect(route.POST(request)).resolves.toBe(response);
  expect(handler).toHaveBeenCalledWith(request);
});
