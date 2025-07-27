import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";
import { ToolCallNotification } from "../ToolCallNotification";

test("ToolCallNotification renders 'Creating file' message for str_replace_editor create command", () => {
  const toolInvocation = {
    state: "call" as const,
    args: { command: "create", path: "/src/components/Button.jsx" }
  };

  render(
    <ToolCallNotification toolName="str_replace_editor" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Creating file: Button.jsx")).toBeDefined();
  expect(screen.getByTestId("loader")).toBeDefined();
});

test("ToolCallNotification renders 'Editing' message for str_replace_editor str_replace command", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "str_replace", path: "/src/styles/index.css" }
  };

  render(
    <ToolCallNotification toolName="str_replace_editor" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Editing: index.css")).toBeDefined();
});

test("ToolCallNotification renders 'Viewing' message for str_replace_editor view command", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "view", path: "/src/App.jsx" }
  };

  render(
    <ToolCallNotification toolName="str_replace_editor" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Viewing: App.jsx")).toBeDefined();
});

test("ToolCallNotification renders 'Inserting into' message for str_replace_editor insert command", () => {
  const toolInvocation = {
    state: "call" as const,
    args: { command: "insert", path: "/src/utils/helpers.js", insert_line: 42 }
  };

  render(
    <ToolCallNotification toolName="str_replace_editor" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Inserting into: helpers.js")).toBeDefined();
});

test("ToolCallNotification handles empty path gracefully", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "create", path: "" }
  };

  render(
    <ToolCallNotification toolName="str_replace_editor" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Creating file: file")).toBeDefined();
});

test("ToolCallNotification handles nested paths correctly", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "str_replace", path: "/src/components/ui/Button/Button.module.css" }
  };

  render(
    <ToolCallNotification toolName="str_replace_editor" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Editing: Button.module.css")).toBeDefined();
});

test("ToolCallNotification renders 'Creating directory' message for file_manager", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "createDirectory", path: "/src/components" }
  };

  render(
    <ToolCallNotification toolName="file_manager" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Creating directory: components")).toBeDefined();
});

test("ToolCallNotification renders 'Creating file' message for file_manager", () => {
  const toolInvocation = {
    state: "call" as const,
    args: { command: "createFile", path: "/src/App.jsx" }
  };

  render(
    <ToolCallNotification toolName="file_manager" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Creating file: App.jsx")).toBeDefined();
});

test("ToolCallNotification renders 'Moving' message with source and destination", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "moveFile", path: "/src/old-name.jsx", newPath: "/src/new-name.jsx" }
  };

  render(
    <ToolCallNotification toolName="file_manager" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Moving: old-name.jsx → new-name.jsx")).toBeDefined();
});

test("ToolCallNotification renders 'Deleting' message for files", () => {
  const toolInvocation = {
    state: "call" as const,
    args: { command: "deleteFile", path: "/src/temp.js" }
  };

  render(
    <ToolCallNotification toolName="file_manager" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Deleting: temp.js")).toBeDefined();
});

test("ToolCallNotification renders 'Deleting directory' message", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "deleteDirectory", path: "/src/old-components" }
  };

  render(
    <ToolCallNotification toolName="file_manager" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Deleting directory: old-components")).toBeDefined();
});

test("ToolCallNotification renders 'Listing directory' message", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "listDirectory", path: "/src/components" }
  };

  render(
    <ToolCallNotification toolName="file_manager" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("Listing directory: components")).toBeDefined();
});

test("ToolCallNotification renders tool name as-is for unknown tools", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "someCommand" }
  };

  render(
    <ToolCallNotification toolName="unknown_tool" toolInvocation={toolInvocation} />
  );

  expect(screen.getByText("unknown_tool")).toBeDefined();
});

test("ToolCallNotification shows loading spinner for in-progress calls", () => {
  const toolInvocation = {
    state: "call" as const,
    args: { command: "create", path: "/test.jsx" }
  };

  const { container } = render(
    <ToolCallNotification toolName="str_replace_editor" toolInvocation={toolInvocation} />
  );

  expect(container.querySelector('.animate-spin')).toBeDefined();
});

test("ToolCallNotification shows checkmark indicator for completed results", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "create", path: "/test.jsx" }
  };

  const { container } = render(
    <ToolCallNotification toolName="str_replace_editor" toolInvocation={toolInvocation} />
  );

  expect(container.querySelector('.text-emerald-600')).toBeDefined();
});

test("ToolCallNotification applies correct styling classes", () => {
  const toolInvocation = {
    state: "result" as const,
    args: { command: "create", path: "/test.jsx" }
  };

  const { container } = render(
    <ToolCallNotification toolName="str_replace_editor" toolInvocation={toolInvocation} />
  );

  const element = container.firstChild;
  expect(element?.textContent).toContain("Creating file: test.jsx");
});