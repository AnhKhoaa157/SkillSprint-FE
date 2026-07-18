import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import MarketplaceCreatorIdentity from "./MarketplaceCreatorIdentity";

describe("MarketplaceCreatorIdentity", () => {
  it("renders the Creator avatar returned by the item-detail API", () => {
    render(<MarketplaceCreatorIdentity creatorName="Chi Dân Hacker" creatorAvatarUrl="https://s3.example.com/avatar.webp" />);

    expect(screen.getByRole("img", { name: "Ảnh đại diện của Chi Dân Hacker" })).toHaveAttribute(
      "src",
      "https://s3.example.com/avatar.webp",
    );
    expect(screen.getByText("Chi Dân Hacker")).toBeInTheDocument();
  });

  it("uses the Creator initial when no avatar URL is available", () => {
    render(<MarketplaceCreatorIdentity creatorName="Chi Dân Hacker" creatorAvatarUrl={null} />);

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });

  it("replaces a failed image with the Creator initial", () => {
    render(<MarketplaceCreatorIdentity creatorName="Chi Dân Hacker" creatorAvatarUrl="https://s3.example.com/expired.webp" />);

    fireEvent.error(screen.getByRole("img", { name: "Ảnh đại diện của Chi Dân Hacker" }));

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    expect(screen.getByText("C")).toBeInTheDocument();
  });
});
