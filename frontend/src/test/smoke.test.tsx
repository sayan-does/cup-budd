import { render, screen } from "@testing-library/react";
import { test, expect } from "vitest";

test("renders", () => {
  render(<div>hello</div>);
  expect(screen.getByText("hello")).toBeInTheDocument();
});
