import manifest from "../../package.json";

describe("extension manifest", () => {
  it("declares a PNG extension icon", () => {
    expect(manifest.icon).toBe("assets/icon.png");
  });

  it("contributes an activity bar dashboard entry", () => {
    expect(manifest.contributes.viewsContainers?.activitybar).toContainEqual({
      id: "logManager",
      title: "Log Manager",
      icon: "assets/activitybar.svg"
    });
    expect(manifest.contributes.views?.logManager).toContainEqual({
      id: "logManager.dashboardView",
      name: "Dashboard",
      type: "webview"
    });
  });

  it("contributes keyboard shortcuts for high-frequency log workflows", () => {
    expect(manifest.contributes.keybindings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          command: "logManager.insertLog",
          key: "ctrl+alt+l",
          mac: "cmd+alt+l"
        }),
        expect.objectContaining({
          command: "logManager.removeCurrentFileLogs",
          key: "ctrl+alt+d",
          mac: "cmd+alt+d"
        })
      ])
    );
  });
});
